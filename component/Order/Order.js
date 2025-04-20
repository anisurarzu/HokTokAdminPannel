import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Tag,
  Card,
  Space,
  Popconfirm,
  Descriptions,
  Badge,
  Select,
  Input,
  message,
  Tabs,
  Divider,
  Typography,
  Spin,
  Form,
  InputNumber,
  Drawer,
  Row,
  Col,
  DatePicker,
  Switch,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  SyncOutlined,
  DollarOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import axios from "@/utils/axiosInstance";
import dayjs from "dayjs";
import coreAxios from "@/utils/axiosInstance";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const statusColors = {
    pending: "orange",
    processing: "blue",
    shipped: "geekblue",
    delivered: "green",
    cancelled: "red",
  };

  const statusIcons = {
    pending: <ClockCircleOutlined />,
    processing: <SyncOutlined spin />,
    shipped: <TruckOutlined />,
    delivered: <CheckCircleOutlined />,
    cancelled: <CloseCircleOutlined />,
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url =
        activeTab === "all" ? "/orders" : `/orders?status=${activeTab}`;
      const response = await coreAxios.get(url);
      // Handle both array and object response structures
      const ordersData = Array.isArray(response.data)
        ? response.data
        : response.data.orders || [];
      setOrders(ordersData);
    } catch (error) {
      message.error("Failed to fetch orders");
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await coreAxios.put(`/orders/${orderId}/status`, { status });
      message.success("Status updated successfully");
      fetchOrders();
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      message.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await coreAxios.delete(`/orders/hard/${orderId}`);
      message.success("Order deleted successfully");
      fetchOrders();
    } catch (error) {
      message.error("Failed to delete order");
      console.error("Error deleting order:", error);
    }
  };

  const showCreateDrawer = () => {
    form.resetFields();
    setIsDrawerVisible(true);
  };

  const showEditDrawer = (order) => {
    form.setFieldsValue({
      ...order,
      customer: order.customer,
      delivery: order.delivery,
      payment: order.payment,
      status: order.status,
      items: order.items,
    });
    setSelectedOrder(order);
    setIsDrawerVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedOrder) {
        // Update existing order
        await coreAxios.put(`/orders/${selectedOrder._id}`, values);
        message.success("Order updated successfully");
      } else {
        // Create new order
        await coreAxios.post("/orders", values);
        message.success("Order created successfully");
      }
      setIsDrawerVisible(false);
      // Reset selected order and refresh data
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error(error.response?.data?.message || "Failed to submit order");
    }
  };

  const refreshData = () => {
    fetchOrders();
  };

  const columns = [
    {
      title: "Order No",
      dataIndex: "orderNo",
      key: "orderNo",
      render: (orderNo) => <span className="font-mono">{orderNo}</span>,
    },
    {
      title: "Date",
      dataIndex: "status",
      key: "date",
      render: (status) => dayjs(status.orderDate).format("DD MMM YYYY HH:mm"),
      sorter: (a, b) =>
        new Date(a.status.orderDate) - new Date(b.status.orderDate),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => (
        <div>
          <div>{record.customer?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">
            {record.customer?.phone || ""}
          </div>
        </div>
      ),
    },
    {
      title: "Items",
      key: "items",
      render: (_, record) => (
        <div className="text-center">
          {record.items?.reduce((acc, item) => acc + (item.quantity || 0), 0)}
        </div>
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => <span>৳{total?.toFixed(2) || "0.00"}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag icon={statusIcons[status.type]} color={statusColors[status.type]}>
          {status.type?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record)}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => showEditDrawer(record)}
          />
          <Select
            value={record.status.type}
            style={{ width: 120 }}
            onChange={(value) => handleStatusChange(record._id, value)}
            disabled={record.status.type === "cancelled"}>
            <Option value="pending">Pending</Option>
            <Option value="processing">Processing</Option>
            <Option value="shipped">Shipped</Option>
            <Option value="delivered">Delivered</Option>
            <Option value="cancelled">Cancel</Option>
          </Select>
          <Popconfirm
            title="Are you sure to delete this order?"
            onConfirm={() => handleDeleteOrder(record._id)}
            okText="Yes"
            cancelText="No">
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredOrders = Array.isArray(orders)
    ? orders.filter((order) => {
        if (!order) return false;
        const searchLower = searchText.toLowerCase();
        return (
          order.orderNo?.toLowerCase().includes(searchLower) ||
          false ||
          order.customer?.name?.toLowerCase().includes(searchLower) ||
          false ||
          order.customer?.phone?.toLowerCase().includes(searchLower) ||
          false
        );
      })
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <Card
        title="Order Management"
        extra={
          <Space>
            <Input
              placeholder="Search orders..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Button
              type="primary"
              onClick={showCreateDrawer}
              icon={<PlusOutlined />}>
              New Order
            </Button>
            <Button onClick={refreshData} icon={<SyncOutlined />}>
              Refresh
            </Button>
          </Space>
        }>
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          <TabPane tab="All Orders" key="all">
            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={filteredOrders}
                rowKey="_id"
                loading={false}
                scroll={{ x: 1500 }}
              />
            </Spin>
          </TabPane>

          {Object.keys(statusColors).map((status) => (
            <TabPane
              key={status}
              tab={status.charAt(0).toUpperCase() + status.slice(1)}>
              <Spin spinning={loading}>
                <Table
                  columns={columns}
                  dataSource={filteredOrders.filter(
                    (order) => order?.status?.type === status
                  )}
                  rowKey="_id"
                  loading={false}
                  scroll={{ x: 1500 }}
                />
              </Spin>
            </TabPane>
          ))}
        </Tabs>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        title={`Order #${selectedOrder?.orderNo}`}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}>
        {selectedOrder ? (
          <div className="space-y-4">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Order Date">
                {dayjs(selectedOrder.status.orderDate).format(
                  "DD MMM YYYY hh:mm A"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag
                  color={statusColors[selectedOrder.status.type]}
                  icon={statusIcons[selectedOrder.status.type]}>
                  {selectedOrder.status.type.toUpperCase()}
                </Tag>
                {selectedOrder.status.orderDeliveryDate && (
                  <div className="mt-1 text-xs">
                    Delivered on:{" "}
                    {dayjs(selectedOrder.status.orderDeliveryDate).format(
                      "DD MMM YYYY"
                    )}
                  </div>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                <Space direction="vertical">
                  <div>
                    <UserOutlined className="mr-2" />
                    {selectedOrder.customer?.name}
                  </div>
                  <div>
                    <PhoneOutlined className="mr-2" />
                    {selectedOrder.customer?.phone || "N/A"}
                  </div>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>
                <EnvironmentOutlined className="mr-2" />
                {selectedOrder.customer?.address}
              </Descriptions.Item>
              <Descriptions.Item label="Delivery">
                <Space direction="vertical">
                  <div>
                    <Tag color="blue">
                      {selectedOrder.delivery?.type?.toUpperCase()}
                    </Tag>
                    <span className="ml-2">
                      ৳{selectedOrder.delivery?.cost?.toFixed(2)}
                    </span>
                  </div>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Payment">
                <Space direction="vertical">
                  <div>
                    <Tag color="blue" icon={<DollarOutlined />}>
                      {selectedOrder.payment?.method?.toUpperCase()}
                    </Tag>
                    <span className="ml-2">
                      ৳{selectedOrder.payment?.amount?.toFixed(2)}
                    </span>
                  </div>
                  <Badge
                    status={selectedOrder.payment?.paid ? "success" : "error"}
                    text={selectedOrder.payment?.paid ? "Paid" : "Unpaid"}
                  />
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Order Items</Divider>

            <div className="border rounded divide-y">
              {selectedOrder.items?.map((item, index) => (
                <div
                  key={index}
                  className="p-4 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                      {item.product?.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400">No Image</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {item.product?.name || "Product not found"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.size && (
                          <Tag color="cyan" className="mr-2">
                            Size: {item.size}
                          </Tag>
                        )}
                      </div>
                      <div className="text-gray-500 mt-1">
                        Qty: {item.quantity} × ৳
                        {item.price?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                  </div>
                  <div className="font-medium">
                    ৳{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <div className="text-right space-y-2 w-64">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>৳{selectedOrder.subtotal?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>
                    ৳{selectedOrder.delivery?.cost?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold text-lg">
                  <span>Total:</span>
                  <span>৳{selectedOrder.total?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>

            {selectedOrder.note && (
              <>
                <Divider orientation="left">Customer Note</Divider>
                <div className="p-4 bg-gray-50 rounded">
                  <Text>{selectedOrder.note}</Text>
                </div>
              </>
            )}
          </div>
        ) : (
          <Spin spinning={!selectedOrder} />
        )}
      </Modal>

      {/* Create/Edit Order Drawer */}
      <Drawer
        title={selectedOrder ? "Edit Order" : "Create New Order"}
        width={720}
        onClose={() => setIsDrawerVisible(false)}
        visible={isDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
        footer={
          <div style={{ textAlign: "right" }}>
            <Button
              onClick={() => setIsDrawerVisible(false)}
              style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} type="primary">
              Submit
            </Button>
          </div>
        }>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={["customer", "name"]}
                label="Customer Name"
                rules={[
                  { required: true, message: "Please enter customer name" },
                ]}>
                <Input placeholder="Customer Name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={["customer", "phone"]}
                label="Phone Number"
                rules={[
                  { required: true, message: "Please enter phone number" },
                ]}>
                <Input placeholder="Phone Number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name={["customer", "address"]}
                label="Address"
                rules={[{ required: true, message: "Please enter address" }]}>
                <TextArea rows={2} placeholder="Address" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Delivery Information</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={["delivery", "type"]}
                label="Delivery Type"
                initialValue="inside">
                <Select>
                  <Option value="inside">Inside City</Option>
                  <Option value="outside">Outside City</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={["delivery", "cost"]}
                label="Delivery Cost"
                initialValue={0}>
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(value) => `৳ ${value}`}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Payment Information</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={["payment", "method"]}
                label="Payment Method"
                initialValue="cod">
                <Select>
                  <Option value="cod">Cash on Delivery</Option>
                  <Option value="card">Credit Card</Option>
                  <Option value="banktransfer">Bank Transfer</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={["payment", "amount"]}
                label="Amount"
                initialValue={0}>
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(value) => `৳ ${value}`}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={["payment", "paid"]}
                label="Payment Status"
                valuePropName="checked">
                <Switch checkedChildren="Paid" unCheckedChildren="Unpaid" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Order Status</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={["status", "type"]}
                label="Status"
                initialValue="pending">
                <Select>
                  <Option value="pending">Pending</Option>
                  <Option value="processing">Processing</Option>
                  <Option value="shipped">Shipped</Option>
                  <Option value="delivered">Delivered</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={["status", "orderDeliveryDate"]}
                label="Delivery Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Order Items</Divider>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: "flex", marginBottom: 8 }}
                    align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, "product"]}
                      label="Product"
                      rules={[
                        { required: true, message: "Product is required" },
                      ]}>
                      <Input placeholder="Product ID" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "size"]}
                      label="Size">
                      <Input placeholder="Size" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "price"]}
                      label="Price"
                      rules={[
                        { required: true, message: "Price is required" },
                      ]}>
                      <InputNumber min={0} placeholder="Price" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "quantity"]}
                      label="Qty"
                      rules={[
                        { required: true, message: "Quantity is required" },
                      ]}>
                      <InputNumber min={1} placeholder="Quantity" />
                    </Form.Item>
                    <Button type="link" onClick={() => remove(name)} danger>
                      Remove
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}>
                    Add Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item name="note" label="Note">
            <TextArea rows={4} placeholder="Any special instructions..." />
          </Form.Item>
        </Form>
      </Drawer>
    </motion.div>
  );
};

export default OrderManagement;
