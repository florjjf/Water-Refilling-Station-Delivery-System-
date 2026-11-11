# Water-Refilling-Station-Delivery-System-
 
DATABASE MANAGEMENT SYSTEMS
FINAL PROJECT - DAY 1

Water Refilling Station Delivery System for Barangay 10, Impalambong, Malaybalay City
System Identification, Database Planning, and GitHub Repository Setup




Group Members:
James Justin Flor
Jobella May Paez
Jhenny Lou Rubi
Maerey Tagaloguin

Bachelor of Science in Information Technology

November 11, 2026 
TASK 1 – SYSTEM IDENTIFICATION
Proposed System Title: Water Refilling Station Delivery System
Organization or Intended Environment: Water refilling station businesses that offer water gallon delivery services to customers.
System Description: The system will manage customer information, water orders, delivery schedules, riders, payments, and container deposits. It will help the business monitor deliveries and unpaid customer balances.
Existing Process: The business currently records customer orders, deliveries, and payments manually using notebooks, paper receipts, or messaging applications.
Problems Encountered:
•	Difficulty tracking customer deliveries and order status.
•	Unpaid balances are not properly monitored.
•	Customer and payment records can be lost or misplaced.
•	Delivery schedules and rider assignments are difficult to organize.

Why the System Is Necessary: The system is necessary to make order management, delivery tracking, and payment monitoring faster, easier, and more organized.


TASK 2 – PROBLEM IDENTIFICATION
Problem	What Is Happening	Who Is Affected	Consequences	Proposed Solution
Manual Delivery Tracking	Deliveries are recorded manually.	Owner, staff, and riders	Difficulty monitoring delivery status.	Provide a delivery tracking feature.
Unpaid Customer Balances	Payments and remaining balances are not properly monitored.	Owner and cashier	Missed payments and inaccurate records.	Add payment and balance monitoring.
Disorganized Customer Orders	Customer orders are recorded using notebooks or messages.	Staff and customers	Lost orders and delayed deliveries.	Provide an organized order management system.


TASK 3 – PROJECT OBJECTIVES
General Objective
To develop a Water Refilling Station Delivery System that manages customer orders, delivery tracking, and payment records efficiently.


Specific Objectives
1.	To manage customer information and water gallon orders.
2.	To monitor delivery schedules, delivery status, and rider assignments.
3.	To record customer payments and automatically track unpaid balances.


TASK 4 – TARGET USERS
User Type	Primary Responsibilities	Access Level / Permissions
Administrator / Owner	Manage users, monitor orders, deliveries, and payments.	Full access
Staff / Cashier	Record customer information, orders, and payments.	Add, view, and update records
Delivery Rider	View assigned deliveries and update delivery status.	View assigned deliveries and update status

TASK 5 – INITIAL DATABASE PLANNING
Eight potential database entities based on the proposed system:
Entity Name	Business Purpose	Information to Be Stored (Key Attributes)
Customer	Stores customer information.	Customer_ID, Name, Address, Contact_Number
Order	Records customer water orders.	Order_ID, Customer_ID, Order_Date, Quantity, Total_Amount
Gallon	Stores water gallon and product information.	Gallon_ID, Gallon_Type, Price, Stock_Quantity
Delivery	Records and monitors customer deliveries.	Delivery_ID, Order_ID, Rider_ID, Delivery_Date, Delivery_Status
Rider	Stores delivery rider information.	Rider_ID, Name, Contact_Number
Payment	Records customer payments and balances.	Payment_ID, Order_ID, Amount_Paid, Payment_Date, Payment_Status
Route	Stores delivery route information.	Route_ID, Route_Name, Destination, Description
Container Deposit	Records customer gallon container deposits.	Deposit_ID, Customer_ID, Quantity, Deposit_Amount, Deposit_Status

TASK 6 – DBMS SELECTION
Database Name & Classification: MySQL – Relational Database Management System (SQL).


Justification
MySQL is suitable for the Water Refilling Station Delivery System because it can organize and manage related information such as customers, orders, deliveries, riders, payments, and container deposits. It also supports relationships between tables, making it easier to retrieve and update records.


Advantages
•	Free and open-source.
•	Easy to use and manage.
•	Supports relationships between tables.
•	Provides data security and reliability.
•	Handles large amounts of organized data.

Limitations
•	Requires proper database configuration.
•	Needs regular backups and maintenance.
•	Requires basic SQL knowledge.

Management & Modeling Tools
•	MySQL – For storing and managing database records.
•	phpMyAdmin – For managing the MySQL database through a web browser.
•	MySQL Workbench – For designing and managing database structures.
