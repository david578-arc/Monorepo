import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  try {
    const dataPath = path.join(__dirname, '../../..', 'data', 'Analytics_Test_Data.json')
    
    if (!fs.existsSync(dataPath)) {
      console.log('Analytics_Test_Data.json not found.')
      return
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8')
    const jsonData = JSON.parse(rawData)

    console.log(`Starting database seed with ${jsonData.length} records...`)

    // Clear existing data
    await prisma.payment.deleteMany()
    await prisma.lineItem.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.vendor.deleteMany()
    await prisma.customer.deleteMany()

    let processedCount = 0

    for (const record of jsonData) {
      try {
        // Extract data from complex structure
        const llmData = record.extractedData?.llmData
        if (!llmData) continue

        // Extract vendor info
        const vendorData = llmData.vendor?.value
        const vendorName = vendorData?.vendorName?.value || 'Unknown Vendor'
        
        // Extract customer info
        const customerData = llmData.customer?.value
        const customerName = customerData?.customerName?.value || 'Unknown Customer'
        
        // Extract invoice info
        const invoiceData = llmData.invoice?.value
        const summaryData = llmData.summary?.value
        const invoiceId = invoiceData?.invoiceId?.value
        const invoiceNumber = invoiceId ? `INV-${invoiceId}-${processedCount}` : `INV-${Date.now()}-${processedCount}`
        const totalAmount = Math.abs(parseFloat(summaryData?.invoiceTotal?.value || 0))
        
        // Skip if no valid amount
        if (!totalAmount || totalAmount === 0) continue
        const issueDate = invoiceData?.invoiceDate?.value || new Date().toISOString()
        const paymentData = llmData.payment?.value
        
        // Generate varied due dates and statuses
        const issueDateObj = new Date(issueDate)
        const daysToAdd = 30 + (processedCount % 60) // 30-90 days
        const calculatedDueDate = new Date(issueDateObj)
        calculatedDueDate.setDate(calculatedDueDate.getDate() + daysToAdd)
        const dueDate = paymentData?.dueDate?.value || calculatedDueDate.toISOString()
        
        // Determine status based on position (varied distribution)
        let status = 'PENDING'
        if (processedCount % 3 === 0) status = 'PAID'
        else if (processedCount % 5 === 0) status = 'OVERDUE'
        else status = 'PENDING'
        
        // Extract category from line items and vendor name
        let category = 'General'
        const itemsData = llmData.lineItems?.value?.items?.value
        
        // Analyze line items for category
        if (itemsData && Array.isArray(itemsData) && itemsData.length > 0) {
          const allDescriptions = itemsData.map((item: any) => (item.description?.value || '').toLowerCase()).join(' ')
          
          if (allDescriptions.includes('software') || allDescriptions.includes('lizenz') || allDescriptions.includes('subscription') || vendorName.toLowerCase().includes('software')) {
            category = 'Information Technology'
          } else if (allDescriptions.includes('marketing') || allDescriptions.includes('werbung') || allDescriptions.includes('advertising')) {
            category = 'Marketing'
          } else if (allDescriptions.includes('office') || allDescriptions.includes('büro') || allDescriptions.includes('supplies')) {
            category = 'Operations'
          } else if (allDescriptions.includes('legal') || allDescriptions.includes('recht') || allDescriptions.includes('consulting') || allDescriptions.includes('beratung')) {
            category = 'Legal'
          } else if (allDescriptions.includes('cloud') || allDescriptions.includes('server') || allDescriptions.includes('hosting') || allDescriptions.includes('infrastructure')) {
            category = 'Infrastructure'
          } else if (allDescriptions.includes('hr') || allDescriptions.includes('personal') || allDescriptions.includes('training') || allDescriptions.includes('schulung')) {
            category = 'Human Resources'
          } else if (allDescriptions.includes('dienstleistung') || allDescriptions.includes('service')) {
            // Distribute services across categories based on vendor
            const hash = vendorName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
            const categories = ['Information Technology', 'Marketing', 'Operations', 'Legal', 'Infrastructure', 'Human Resources']
            category = categories[hash % categories.length]
          }
        }
        const description = summaryData?.documentType?.value || 'Invoice'

        // Create or find vendor
        let vendor = await prisma.vendor.findFirst({
          where: { name: vendorName }
        })
        
        if (!vendor) {
          vendor = await prisma.vendor.create({
            data: {
              name: vendorName,
              email: null,
              phone: null,
              address: vendorData?.vendorAddress?.value || null
            }
          })
        }

        // Create or find customer
        let customer = await prisma.customer.findFirst({
          where: { name: customerName }
        })
        
        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              name: customerName,
              email: null,
              phone: null,
              address: customerData?.customerAddress?.value || null
            }
          })
        }

        // Create invoice
        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            vendorId: vendor.id,
            customerId: customer.id,
            issueDate: new Date(issueDate),
            dueDate: dueDate ? new Date(dueDate) : null,
            totalAmount,
            status: status.toUpperCase(),
            category,
            description
          }
        })

        // Create line items
        const lineItemsData = llmData.lineItems?.value?.items?.value
        if (lineItemsData && Array.isArray(lineItemsData)) {
          for (const item of lineItemsData) {
            const desc = item.description?.value || 'Line item'
            const qty = Math.abs(parseFloat(item.quantity?.value || 1))
            const unitPrice = Math.abs(parseFloat(item.unitPrice?.value || 0))
            const totalPrice = Math.abs(parseFloat(item.totalPrice?.value || unitPrice * qty))
            
            await prisma.lineItem.create({
              data: {
                invoiceId: invoice.id,
                description: desc,
                quantity: qty,
                unitPrice,
                totalPrice
              }
            })
          }
        }

        // Create payment if paid
        if (status.toUpperCase() === 'PAID') {
          const paymentAmount = parseFloat(paymentData?.amount?.value || totalAmount)
          const paymentDate = paymentData?.paymentDate?.value || new Date().toISOString()
          const paymentMethod = paymentData?.paymentMethod?.value || 'BANK_TRANSFER'
          
          await prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: paymentAmount,
              paymentDate: new Date(paymentDate),
              paymentMethod: paymentMethod.toUpperCase().replace(/\s+/g, '_'),
              reference: paymentData?.reference?.value || null
            }
          })
        }

        processedCount++
        if (processedCount % 10 === 0) {
          console.log(`Processed ${processedCount} invoices...`)
        }
      } catch (error) {
        console.error(`Error processing record:`, error)
      }
    }

    // Create demo users
    await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: {
        email: 'admin@demo.com',
        password: 'password',
        name: 'Demo Admin',
        role: 'ADMIN'
      }
    })

    await prisma.user.upsert({
      where: { email: 'user@demo.com' },
      update: {},
      create: {
        email: 'user@demo.com',
        password: 'password',
        name: 'Demo User',
        role: 'USER'
      }
    })

    console.log(`✅ Database seeded successfully!`)
    console.log(`📊 Processed ${processedCount} invoices`)
    console.log(`👤 Demo user: admin@demo.com / password`)
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
