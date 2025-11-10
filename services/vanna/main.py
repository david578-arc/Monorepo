from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import psycopg2
from urllib.parse import urlparse
import json

load_dotenv()

app = FastAPI(title="Vanna AI Service", version="1.0.0")

# CORS Configuration for Production
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

# Add development origins
allowed_origins.extend([
    "http://localhost:3000",
    "http://localhost:3002",
    "http://localhost:3001"
])

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["Content-Type"],
    max_age=3600,
)

# Database connection
def get_db_connection():
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        raise Exception("DATABASE_URL not configured")
    
    # Parse the database URL
    parsed = urlparse(DATABASE_URL)
    return psycopg2.connect(
        host=parsed.hostname,
        database=parsed.path[1:],
        user=parsed.username,
        password=parsed.password,
        port=parsed.port or 5432
    )

# Enhanced SQL generation with more patterns
def generate_sql_from_question(question: str) -> str:
    question_lower = question.lower()
    
    # Revenue and spend queries
    if "total spend" in question_lower or "total revenue" in question_lower:
        return "SELECT SUM(total_amount) as total_revenue FROM Invoice;"
    elif "revenue" in question_lower and "month" in question_lower:
        return """SELECT 
                    TO_CHAR(issue_date, 'Mon YYYY') as month,
                    SUM(total_amount) as revenue 
                 FROM Invoice 
                 GROUP BY TO_CHAR(issue_date, 'Mon YYYY'), DATE_TRUNC('month', issue_date)
                 ORDER BY DATE_TRUNC('month', issue_date);"""
    
    # Vendor queries
    elif "top" in question_lower and ("vendor" in question_lower or "customer" in question_lower):
        limit = "10" if "10" in question_lower else "5"
        return f"""SELECT v.name as vendor_name, SUM(i.total_amount) as total_spend 
                 FROM Invoice i JOIN Vendor v ON i.vendor_id = v.id 
                 GROUP BY v.id, v.name ORDER BY total_spend DESC LIMIT {limit};"""
    
    # Status queries
    elif "overdue" in question_lower:
        return """SELECT i.invoice_number, v.name as vendor, i.total_amount, i.due_date 
                 FROM Invoice i JOIN Vendor v ON i.vendor_id = v.id 
                 WHERE i.status = 'OVERDUE';"""
    elif "paid" in question_lower:
        return """SELECT i.invoice_number, v.name as vendor, i.total_amount, i.issue_date 
                 FROM Invoice i JOIN Vendor v ON i.vendor_id = v.id 
                 WHERE i.status = 'PAID';"""
    elif "pending" in question_lower:
        return """SELECT i.invoice_number, v.name as vendor, i.total_amount, i.due_date 
                 FROM Invoice i JOIN Vendor v ON i.vendor_id = v.id 
                 WHERE i.status = 'PENDING';"""
    
    # Category queries
    elif "category" in question_lower:
        if "average" in question_lower:
            return """SELECT category, AVG(total_amount) as avg_amount 
                     FROM Invoice WHERE category IS NOT NULL 
                     GROUP BY category;"""
        else:
            return """SELECT category, SUM(total_amount) as total_spend, COUNT(*) as invoice_count 
                     FROM Invoice WHERE category IS NOT NULL 
                     GROUP BY category ORDER BY total_spend DESC;"""
    
    # Time-based queries
    elif "this month" in question_lower:
        return """SELECT COUNT(*) as invoice_count, SUM(total_amount) as total_amount 
                 FROM Invoice 
                 WHERE EXTRACT(MONTH FROM issue_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
                 AND EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE);"""
    elif "last 90 days" in question_lower or "90 days" in question_lower:
        return """SELECT COUNT(*) as invoice_count, SUM(total_amount) as total_spend 
                 FROM Invoice 
                 WHERE issue_date >= CURRENT_DATE - INTERVAL '90 days';"""
    elif "this year" in question_lower:
        return """SELECT COUNT(*) as invoice_count, SUM(total_amount) as total_revenue 
                 FROM Invoice 
                 WHERE EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE);"""
    
    # Count queries
    elif "how many" in question_lower:
        if "invoice" in question_lower:
            return "SELECT COUNT(*) as total_invoices FROM Invoice;"
        elif "vendor" in question_lower:
            return "SELECT COUNT(*) as total_vendors FROM Vendor;"
        elif "customer" in question_lower:
            return "SELECT COUNT(*) as total_customers FROM Customer;"
    
    # Default query
    else:
        return "SELECT COUNT(*) as total_invoices, SUM(total_amount) as total_revenue FROM Invoice;"

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    sql: str
    results: list
    message: str

@app.post("/query", response_model=QueryResponse)
async def query_data(request: QueryRequest):
    try:
        # Generate SQL from question
        sql = generate_sql_from_question(request.question)
        
        # Execute the SQL
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(sql)
        results = cursor.fetchall()
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        
        # Convert to list of dictionaries
        data = [dict(zip(columns, row)) for row in results]
        
        cursor.close()
        conn.close()
        
        return QueryResponse(
            sql=sql,
            results=data,
            message=f"Found {len(data)} results"
        )
        
    except Exception as e:
        print(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))