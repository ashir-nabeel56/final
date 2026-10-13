const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const formatAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? `Rs. ${amount.toFixed(2)}` : "Rs. 0.00";
};

const renderOrderInvoice = (order) => {
    const shipping = order.shippingInfo || {};
    const customer = order.user || {};
    const items = Array.isArray(order.items) ? order.items : [];
    const customerName = shipping.fullName || customer.name || "Not provided";
    const email = shipping.email || customer.email || "Not provided";
    const address = [
        shipping.address,
        shipping.city,
        shipping.postalCode,
    ].filter(Boolean);
    const orderDate = order.createdAt
        ? new Date(order.createdAt).toLocaleString()
        : "Not available";

    const itemRows = items.map((item) => {
        const product = item.product || {};
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        return `<tr><td>${escapeHtml(product.title || "Product unavailable")}</td><td>${quantity}</td><td>${formatAmount(price)}</td><td>${formatAmount(price * quantity)}</td></tr>`;
    }).join("");

    const summaryRow = (label, value) =>
        `<tr><th>${escapeHtml(label)}</th><td>${formatAmount(value)}</td></tr>`;

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice ${escapeHtml(order._id || "Order")}</title>
  <style>
    body{font:16px Arial,sans-serif;color:#222;margin:32px}h1{margin-bottom:8px}
    .details{display:flex;justify-content:space-between;gap:32px;margin:24px 0}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th,td{border:1px solid #ddd;padding:10px;text-align:left}
    .summary{max-width:420px;margin-left:auto}.summary th{width:60%}
    @media print{body{margin:0}.no-print{display:none}}
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()">Print invoice</button>
  <h1>Invoice</h1>
  <div class="details">
    <section><h2>Customer</h2>
      <div>${escapeHtml(customerName)}</div>
      <div>${escapeHtml(email)}</div>
      <div>${escapeHtml(shipping.phone || "Not provided")}</div>
      <div>${escapeHtml(address.join(", ") || "Not provided")}</div>
    </section>
    <section><h2>Order</h2>
      <div>Order ID: ${escapeHtml(order._id || "Not available")}</div>
      <div>Date: ${escapeHtml(orderDate)}</div>
    </section>
  </div>
  <table>
    <thead><tr><th>Item</th><th>Quantity</th><th>Price</th><th>Line total</th></tr></thead>
    <tbody>${itemRows || '<tr><td colspan="4">No items available</td></tr>'}</tbody>
  </table>
  <table class="summary"><tbody>
    ${summaryRow("Subtotal", order.subtotal)}
    ${summaryRow("Discount", order.discount)}
    ${summaryRow("Delivery fee", order.deliveryFee)}
    ${summaryRow("Final total", order.totalPrice)}
  </tbody></table>
</body>
</html>`;
};

module.exports = renderOrderInvoice;
