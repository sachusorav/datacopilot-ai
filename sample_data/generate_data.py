import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

np.random.seed(42)

n_rows = 150
start_date = datetime(2024, 1, 1)

customer_ids = [f"CUST-{i:03d}" for i in range(1, 36)]
customer_names = [
    "Rohan Mehta", "Ananya Sharma", "David Smith", "Priya Patel", "Marcus Chen",
    "Sarah Jenkins", "Vikram Singh", "Elena Rostova", "Liam O'Connor", "Aisha Khan",
    "Carlos Gomez", "Yuki Tanaka", "Emily Watson", "Arjun Reddy", "Hannah Abbott",
    "Michael Brown", "Sofia Martinez", "Kavya Nair", "James Wilson", "Chloe Taylor",
    "Rahul Joshi", "Zoe Anderson", "Devendra Verma", "Jessica Taylor", "Omar Al-Mansoor",
    "Siddharth Gupta", "Mia Martin", "Deepak Kumar", "Grace Kim", "Nikhil Rao",
    "Rachel Green", "Amitabh Bachan", "Lisa Cuddy", "Gregory House", "John Doe"
]

categories = {
    "Electronics": [("Wireless Mouse", 29.99), ("Mechanical Keyboard", 89.99), ("Smart Watch", 199.99), ("USB-C Hub", 39.99), ("Bluetooth Speaker", 59.99)],
    "Furniture": [("Ergonomic Chair", 249.99), ("Standing Desk", 399.99), ("LED Desk Lamp", 45.00), ("Monitor Stand", 34.99)],
    "Office Supplies": [("Notebook 3-Pack", 12.50), ("Gel Pens Set", 8.99), ("File Organizer", 22.00), ("Stapler Heavy Duty", 18.50)],
    "Clothing": [("Tech Fleece Jacket", 79.99), ("Cotton Polo Shirt", 29.99), ("Backpack Pro", 65.00)]
}

regions = ["North", "South", "East", "West", "Central"]
segments = ["Consumer", "Corporate", "Small Business"]

data = []
for i in range(1, n_rows + 1):
    order_id = f"ORD-{1000 + i}"
    days_offset = np.random.randint(0, 420)
    order_date = (start_date + timedelta(days=int(days_offset))).strftime("%Y-%m-%d")
    
    cust_idx = np.random.randint(0, len(customer_ids))
    cust_id = customer_ids[cust_idx]
    cust_name = customer_names[cust_idx]
    
    cat = np.random.choice(list(categories.keys()))
    prod_info = categories[cat][np.random.randint(0, len(categories[cat]))]
    prod_name, unit_price = prod_info
    
    quantity = np.random.randint(1, 6)
    total_sales = round(quantity * unit_price, 2)
    region = np.random.choice(regions)
    segment = np.random.choice(segments)
    
    cust_age = np.random.randint(21, 65)
    recency_days = np.random.randint(2, 120)
    purchase_freq = np.random.randint(1, 18)
    
    # Churn probability based on recency and frequency
    churn_prob = 1.0 / (1.0 + np.exp(-(-2.0 + 0.04 * recency_days - 0.2 * purchase_freq)))
    churned = 1 if np.random.rand() < churn_prob else 0
    
    data.append({
        "Order_ID": order_id,
        "Order_Date": order_date,
        "Customer_ID": cust_id,
        "Customer_Name": cust_name,
        "Region": region,
        "Customer_Segment": segment,
        "Product_Category": cat,
        "Product_Name": prod_name,
        "Quantity": quantity,
        "Unit_Price": unit_price,
        "Total_Sales": total_sales,
        "Customer_Age": cust_age,
        "Recency_Days": recency_days,
        "Purchase_Frequency": purchase_freq,
        "Churned": churned
    })

df = pd.DataFrame(data)

# Add 3 exact duplicate rows to test data cleaning
df = pd.concat([df, df.iloc[[5, 12, 25]]], ignore_index=True)

# Add a few missing values in Region, Quantity, and Unit_Price to demonstrate cleaning
df.loc[10, "Region"] = np.nan
df.loc[20, "Quantity"] = np.nan
df.loc[30, "Unit_Price"] = np.nan

os.makedirs("sample_data", exist_ok=True)
output_path = "sample_data/retail_sales_churn.csv"
df.to_csv(output_path, index=False)
print(f"Sample dataset generated successfully at {output_path} with {len(df)} rows.")
