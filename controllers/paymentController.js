const path = require("path");
const { readFileSafely, writeFileSafely } = require("../utils/fileUtils");



// Path to the JSON file storing payment data
const paymentsFile = path.join(__dirname, "../models/payments.json");
const salesmenFile = path.join(__dirname, "../models/salesman.json"); 



  

// Create Payment Entry
exports.createPayment = (req, res) => {
  try {
    const { amount, type, salesmanId } = req.body;

    // Validate required fields
    if (!amount || !type || !salesmanId) {
      return res.status(400).json({ status: 400, message: "Missing required fields" });
    }

    // Read existing salesmen data
    let salesmen = readFileSafely(salesmenFile) || [];

    // Check if the salesman exists
    const salesman = salesmen.find((s) => s.id.toString() === salesmanId.toString());

    if (!salesman) {
      return res.status(404).json({ status: 404, message: "Invalid salesmanId: Salesman not found" });
    }

    // Read existing payments
    let payments = readFileSafely(paymentsFile) || [];

    // Generate a new ID (increment last ID)
    const newId = payments.length > 0 ? payments[payments.length - 1].id + 1 : 1;

    // Create a new payment object
    const newPayment = {
      id: newId.toString(),
      amount: parseInt(amount, 10),
      type,
      salesmanId: salesman.id.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Pending",
      referenceNo: `REF-${newId}`,
      salesmenInfo: {
        id: salesman.id.toString(),
        name: salesman.name,
        dialcode:"+91",
        mobile: salesman.mobile 
      },
    };

    // Add new payment to the list
    payments.push(newPayment);
    writeFileSafely(paymentsFile, payments);

    res.status(201).json({ status: 201, message: "Payment entry created successfully", data: newPayment });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

class Payment {
  constructor(id, amount, type, salesmanId, date, status = "Pending") {
    this.id = id;
    this.amount = amount.toString();
    this.type = type;
    this.salesmanId = salesmanId.toString();
    this.date = date;
    this.status = status; // Add status field
  }

  static fromJson(json) {
    return new Payment(json.id, json.amount, json.type, json.salesmanId, json.date, json.status);
  }
}


// Get All Payments with Salesman Details
exports.getAllPayments = (req, res) => {
  try {
    let { keyword = "", page = "1", limit = "10", status = "" } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    let payments = readFileSafely(paymentsFile) || []; // Read payments data
    let salesmen = readFileSafely(salesmenFile) || []; // Read salesmen data

    // Convert payments into Payment objects
    payments = payments.map(Payment.fromJson);

    // Filter by keyword (search in amount and status)
    if (keyword) {
      payments = payments.filter(
        (p) =>
          p.amount.toString().includes(keyword) ||
          p.status.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    // Filter by status (if applicable)
    if (status) {
      payments = payments.filter((p) => p.status.toLowerCase() === status.toLowerCase());
    }

    // Implement Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPayments = payments.slice(startIndex, endIndex);

    // Attach full salesman data to each payment
    const paymentsWithSalesmen = paginatedPayments.map((p) => {
      const salesman = salesmen.find((s) => s.id.toString() === p.salesmanId) || {};
      return {
        id: p.id.toString(),
        amount: parseInt(p.amount, 10),
        type: p.type,
        salesmanId: p.salesmanId.toString(),
        createdAt: p.date,
        updatedAt: p.date,
        status: p.status, // Ensure status is included
        referenceNo: `REF-${p.id}`,
        salesmenInfo: {
          id: salesman.id || p.salesmanId,
          name: salesman.name || "Unknown Salesman",
          dialcode: "+91",
          mobile: salesman.mobile || "N/A",
          email: salesman.email || "N/A",
          status: salesman.status || false,
          createdAt: salesman.createdAt || "N/A",
          updatedAt: salesman.updatedAt || "N/A",
        },
      };
    });
    

    res.status(200).json({
      status: 200,
      message: "Payments fetched successfully",
      data: {
        docs: paymentsWithSalesmen,
        totalDocs: payments.length,
        limit,
        page,
        totalPages: Math.ceil(payments.length / limit),
        pagingCounter: startIndex + 1,
        hasPrevPage: page > 1,
        hasNextPage: endIndex < payments.length,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: endIndex < payments.length ? page + 1 : null,
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};