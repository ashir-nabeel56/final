const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "order-route-tests";

const Cart = require("../models/cart");
const Order = require("../models/orders");
const orderRoutes = require("../routes/orderRoutes");
const renderOrderInvoice = require("../utils/orderInvoice");

const shippingInfo = {
    fullName: "Ayesha Khan",
    email: "AYESHA@example.com",
    phone: "0300-1234567",
    address: "House 10, Main Road",
    city: "Lahore",
    postalCode: "54000",
};

const user = { _id: "customer-1", name: "Ayesha", email: "user@example.com" };
const order = {
    _id: "order-1",
    user,
    shippingInfo: { ...shippingInfo, email: shippingInfo.email.toLowerCase() },
    items: [
        {
            product: { title: "Cotton Shirt" },
            quantity: 2,
            price: 100,
        },
    ],
    subtotal: 200,
    discount: 40,
    deliveryFee: 15,
    totalPrice: 175,
    createdAt: "2026-10-13T10:00:00.000Z",
};

const originalCartFindOne = Cart.findOne;
const originalOrderMethods = {
    create: Order.create,
    find: Order.find,
    findById: Order.findById,
};

test.afterEach(() => {
    Cart.findOne = originalCartFindOne;
    Order.create = originalOrderMethods.create;
    Order.find = originalOrderMethods.find;
    Order.findById = originalOrderMethods.findById;
});

const createQuery = (value) => ({
    populate() {
        return this;
    },
    sort() {
        return this;
    },
    then(resolve, reject) {
        return Promise.resolve(value).then(resolve, reject);
    },
});

const request = async (t, method, path, { role = "user", body } = {}) => {
    const app = express();
    app.use(express.json());
    app.use("/orders", orderRoutes);
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const token = jwt.sign(
        { userId: role === "admin" ? "admin-1" : user._id, role },
        process.env.JWT_SECRET
    );
    return fetch(`http://127.0.0.1:${server.address().port}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
};

test("order creation persists validated shipping details", async (t) => {
    let createdOrder;
    const cart = {
        items: [{ product: { _id: "product-1", price: 100 }, quantity: 2 }],
        async save() {},
    };
    Cart.findOne = () => ({
        populate: async () => cart,
    });
    Order.create = async (fields) => {
        createdOrder = fields;
        return { _id: order._id };
    };
    Order.findById = () => createQuery(order);

    const response = await request(t, "POST", "/orders", {
        body: { shippingInfo },
    });
    const result = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(createdOrder.shippingInfo, {
        ...shippingInfo,
        email: shippingInfo.email.toLowerCase(),
    });
    assert.deepEqual(result.order.shippingInfo, createdOrder.shippingInfo);
});

test("admin order list and detail return persisted shipping details", async (t) => {
    Order.find = () => createQuery([order]);
    Order.findById = () => createQuery(order);

    const listResponse = await request(t, "GET", "/orders", { role: "admin" });
    const list = await listResponse.json();
    assert.equal(listResponse.status, 200);
    assert.deepEqual(list.orders[0].shippingInfo, order.shippingInfo);

    const detailResponse = await request(t, "GET", "/orders/order-1", {
        role: "admin",
    });
    const detail = await detailResponse.json();
    assert.equal(detailResponse.status, 200);
    assert.deepEqual(detail.order.shippingInfo, order.shippingInfo);
});

test("admin-only order list denies regular customers", async (t) => {
    const response = await request(t, "GET", "/orders");
    assert.equal(response.status, 403);
});

test("invoice renders customer, item and totals, and tolerates legacy order data", () => {
    const invoice = renderOrderInvoice(order);
    for (const expected of [
        "Ayesha Khan",
        "ayesha@example.com",
        "0300-1234567",
        "House 10, Main Road, Lahore, 54000",
        "order-1",
        "Cotton Shirt",
        "Rs. 200.00",
        "Rs. 40.00",
        "Rs. 15.00",
        "Rs. 175.00",
    ]) {
        assert.ok(invoice.includes(expected), `invoice should include ${expected}`);
    }

    const legacyInvoice = renderOrderInvoice({
        _id: "legacy-order",
        user: { name: "<Old Customer>", email: "old@example.com" },
        items: [],
    });
    assert.ok(legacyInvoice.includes("&lt;Old Customer&gt;"));
    assert.ok(legacyInvoice.includes("Not provided"));
    assert.ok(legacyInvoice.includes("No items available"));
    assert.ok(legacyInvoice.includes("Rs. 0.00"));
});
