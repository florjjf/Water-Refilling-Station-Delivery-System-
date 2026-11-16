// Water Refilling Station Delivery System

Table customer {

&nbsp; Customer_ID integer \[primary key\]

&nbsp; Name varchar

&nbsp; Address varchar

&nbsp; Contact_Number varchar

}

Table orders {

&nbsp; Order_ID integer \[primary key\]

&nbsp; Customer_ID integer \[not null\]

&nbsp; Order_Date date

&nbsp; Quantity integer

&nbsp; Total_Amount decimal

&nbsp; Order_Status varchar

}

Table gallon {

&nbsp; Gallon_ID integer \[primary key\]

&nbsp; Gallon_Type varchar

&nbsp; Price decimal

&nbsp; Stock_Quantity integer

}

Table delivery {

&nbsp; Delivery_ID integer \[primary key\]

&nbsp; Order_ID integer \[not null\]

&nbsp; Rider_ID integer \[not null\]

&nbsp; Route_ID integer \[not null\]

&nbsp; Delivery_Date date

&nbsp; Delivery_Status varchar

}

Table rider {

&nbsp; Rider_ID integer \[primary key\]

&nbsp; Name varchar

&nbsp; Contact_Number varchar

}

Table payment {

&nbsp; Payment_ID integer \[primary key\]

&nbsp; Order_ID integer \[not null\]

&nbsp; Amount_Paid decimal

&nbsp; Payment_Date date

&nbsp; Payment_Status varchar

}

Table route {

&nbsp; Route_ID integer \[primary key\]

&nbsp; Route_Name varchar

&nbsp; Destination varchar

&nbsp; Description text

}

Table container_deposit {

&nbsp; Deposit_ID integer \[primary key\]

&nbsp; Customer_ID integer \[not null\]

&nbsp; Quantity integer

&nbsp; Deposit_Amount decimal

&nbsp; Deposit_Status varchar

}

Ref: orders.Customer_ID > customer.Customer_ID

Ref: container_deposit.Customer_ID > customer.Customer_ID

Ref: delivery.Order_ID > orders.Order_ID

Ref: payment.Order_ID > orders.Order_ID

Ref: delivery.Rider_ID > rider.Rider_ID

Ref: delivery.Route_ID > route.Route_ID