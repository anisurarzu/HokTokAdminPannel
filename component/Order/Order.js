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
  Image,
  Skeleton,
  Avatar,
  List,
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
  ShoppingOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import axios from "@/utils/axiosInstance";
import dayjs from "dayjs";
import coreAxios from "@/utils/axiosInstance";

const { Title, Text, Paragraph } = Typography;
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
  const [statusChanging, setStatusChanging] = useState({});
  const [tableLoading, setTableLoading] = useState(false);

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
    setTableLoading(true);
    try {
      const url =
        activeTab === "all" ? "/orders" : `/orders?status=${activeTab}`;
      const response = await coreAxios.get(url);
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
      setTableLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const confirmStatusChange = (orderId, currentStatus, newStatus) => {
    if (newStatus === "processing") {
      Modal.confirm({
        title: "Confirm Order Processing",
        content:
          "This will deduct product quantities from inventory. Continue?",
        onOk: () => handleStatusChange(orderId, newStatus),
      });
    } else if (currentStatus === "processing" && newStatus === "cancelled") {
      Modal.confirm({
        title: "Confirm Order Cancellation",
        content: "This will restore product quantities to inventory. Continue?",
        onOk: () => handleStatusChange(orderId, newStatus),
      });
    } else {
      handleStatusChange(orderId, newStatus);
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      setStatusChanging((prev) => ({ ...prev, [orderId]: true }));
      await coreAxios.put(`/orders/${orderId}/status`, { status });

      let successMessage = "Status updated successfully";
      if (status === "processing") {
        successMessage =
          "Order processing started - product quantities updated";
      } else if (status === "cancelled") {
        successMessage = "Order cancelled - product quantities restored";
      }

      message.success(successMessage);
      fetchOrders();
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);

      let errorMessage = "Failed to update status";
      if (error.response?.data?.message?.includes("Insufficient stock")) {
        errorMessage = "Cannot process order: Insufficient stock available";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      message.error(errorMessage);
    } finally {
      setStatusChanging((prev) => ({ ...prev, [orderId]: false }));
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
    setSelectedOrder(null);
    setIsDrawerVisible(true);
  };

  const showEditDrawer = (order) => {
    form.setFieldsValue({
      ...order,
      customer: order.customer,
      delivery: order.delivery,
      payment: order.payment,
      status: {
        ...order.status,
        orderDeliveryDate: order.status.orderDeliveryDate
          ? dayjs(order.status.orderDeliveryDate)
          : null,
      },
      items: order.items,
    });
    setSelectedOrder(order);
    setIsDrawerVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        ...values,
        status: {
          ...values.status,
          orderDeliveryDate: values.status.orderDeliveryDate
            ? values.status.orderDeliveryDate.toISOString()
            : null,
        },
      };

      if (selectedOrder) {
        await coreAxios.put(`/orders/${selectedOrder._id}`, payload);
        message.success("Order updated successfully");
      } else {
        await coreAxios.post("/orders", payload);
        message.success("Order created successfully");
      }

      setIsDrawerVisible(false);
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
          <div className="font-medium">{record.customer?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">
            {record.customer?.phone || ""}
          </div>
        </div>
      ),
    },
    {
      title: "Products",
      key: "products",
      render: (_, record) => (
        <Avatar.Group maxCount={3}>
          {record.items?.map((item, index) => (
            <Avatar
              key={index}
              src={item.product?.images?.[0]}
              icon={<ShoppingOutlined />}
              shape="square"
            />
          ))}
        </Avatar.Group>
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
      render: (total) => (
        <span className="font-medium">৳{total?.toFixed(2) || "0.00"}</span>
      ),
      sorter: (a, b) => (a.total || 0) - (b.total || 0),
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
      filters: Object.keys(statusColors).map((status) => ({
        text: status.charAt(0).toUpperCase() + status.slice(1),
        value: status,
      })),
      onFilter: (value, record) => record.status.type === value,
    },
    {
      title: "Actions",
      key: "actions",
      // fixed: "right",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record)}
            className="text-blue-500"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => showEditDrawer(record)}
            className="text-green-500"
          />
          <Select
            value={record.status.type}
            style={{ width: 120 }}
            onChange={(value) =>
              confirmStatusChange(record._id, record.status.type, value)
            }
            disabled={
              record.status.type === "cancelled" ||
              record.status.type === "delivered" ||
              statusChanging[record._id]
            }
            loading={statusChanging[record._id]}>
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
            cancelText="No"
            disabled={record.status.type === "delivered"}>
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={record.status.type === "delivered"}
            />
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
          order.customer?.name?.toLowerCase().includes(searchLower) ||
          order.customer?.phone?.toLowerCase().includes(searchLower) ||
          order.status?.type?.toLowerCase().includes(searchLower)
        );
      })
    : [];

  const skeletonColumns = columns.map((column) => ({
    ...column,
    render: () => (
      <Skeleton.Input active size="small" style={{ width: "80%" }} />
    ),
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <Card
        title={
          <div className="flex items-center">
            <Title level={4} className="mb-0">
              Order Management
            </Title>
            <Badge
              count={orders.length}
              showZero
              className="ml-3"
              style={{ backgroundColor: "#1890ff" }}
            />
          </div>
        }
        extra={
          <Space>
            <Input
              placeholder="Search orders..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Button
              type="primary"
              onClick={showCreateDrawer}
              icon={<PlusOutlined />}
              className="bg-blue-600">
              New Order
            </Button>
            <Button
              onClick={refreshData}
              icon={<SyncOutlined />}
              loading={loading}>
              Refresh
            </Button>
          </Space>
        }
        className="shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          tabBarExtraContent={
            <Text type="secondary" className="mr-4">
              Showing {filteredOrders.length} of {orders.length} orders
            </Text>
          }>
          <TabPane tab="All Orders" key="all">
            <Table
              columns={tableLoading ? skeletonColumns : columns}
              dataSource={tableLoading ? Array(5).fill({}) : filteredOrders}
              rowKey="_id"
              // loading={tableLoading}
              scroll={{ x: 1500 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
            />
          </TabPane>

          {Object.keys(statusColors).map((status) => (
            <TabPane
              key={status}
              tab={
                <span>
                  {statusIcons[status]}
                  <span className="ml-2">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </span>
              }>
              <Table
                columns={tableLoading ? skeletonColumns : columns}
                dataSource={
                  tableLoading
                    ? Array(5).fill({})
                    : filteredOrders.filter(
                        (order) => order?.status?.type === status
                      )
                }
                rowKey="_id"
                loading={tableLoading}
                scroll={{ x: 1500 }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                }}
              />
            </TabPane>
          ))}
        </Tabs>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <ShoppingOutlined className="text-blue-500 mr-2" />
            <span>Order #{selectedOrder?.orderNo}</span>
          </div>
        }
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={900}
        className="order-detail-modal">
        {selectedOrder ? (
          <div className="space-y-6">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Order Date" span={2}>
                <div className="flex items-center">
                  <ClockCircleOutlined className="mr-2 text-gray-500" />
                  {dayjs(selectedOrder.status.orderDate).format(
                    "dddd, MMMM D, YYYY h:mm A"
                  )}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Status">
                <div className="flex items-center">
                  <Tag
                    color={statusColors[selectedOrder.status.type]}
                    icon={statusIcons[selectedOrder.status.type]}
                    className="mr-2">
                    {selectedOrder.status.type.toUpperCase()}
                  </Tag>
                  {selectedOrder.status.orderDeliveryDate && (
                    <div className="text-xs text-gray-500">
                      Delivered on:{" "}
                      {dayjs(selectedOrder.status.orderDeliveryDate).format(
                        "MMM D, YYYY"
                      )}
                    </div>
                  )}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Payment Status">
                <Badge
                  status={selectedOrder.payment?.paid ? "success" : "error"}
                  text={
                    <span className="font-medium">
                      {selectedOrder.payment?.paid ? "PAID" : "UNPAID"}
                    </span>
                  }
                />
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" className="mt-6">
              Customer Information
            </Divider>

            <Card size="small">
              <div className="flex items-start">
                <Avatar
                  size={64}
                  icon={<UserOutlined />}
                  className="mr-4"
                  style={{ backgroundColor: "#1890ff" }}
                />
                <div>
                  <Title level={5} className="mb-1">
                    {selectedOrder.customer?.name || "N/A"}
                  </Title>
                  <div className="flex items-center text-gray-600 mb-1">
                    <PhoneOutlined className="mr-2" />
                    <span>{selectedOrder.customer?.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-start text-gray-600">
                    <EnvironmentOutlined className="mr-2 mt-1" />
                    <span>
                      {selectedOrder.customer?.address || "No address provided"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Divider orientation="left" className="mt-6">
              Order Items
            </Divider>

            <List
              itemLayout="horizontal"
              dataSource={selectedOrder.items}
              renderItem={(item) => (
                <List.Item className="p-4 border-b">
                  <List.Item.Meta
                    avatar={
                      <Image
                        width={80}
                        height={80}
                        src={item.product?.images?.[0]}
                        alt={item.product?.name}
                        fallback="https://via.placeholder.com/80"
                        placeholder={
                          <Skeleton.Image
                            active
                            style={{ width: 80, height: 80 }}
                          />
                        }
                        className="rounded border"
                      />
                    }
                    title={
                      <a href="#" className="text-blue-500">
                        {item.product?.name || "Product not found"}
                      </a>
                    }
                    description={
                      <div className="space-y-1">
                        {item.size && (
                          <Tag color="blue" className="mr-2">
                            Size: {item.size}
                          </Tag>
                        )}
                        <div className="text-gray-500">
                          SKU: {item.product?._id || "N/A"}
                        </div>
                      </div>
                    }
                  />
                  <div className="text-right">
                    <div className="font-medium">
                      ৳{item.price?.toFixed(2) || "0.00"} × {item.quantity || 0}
                    </div>
                    <div className="text-lg font-semibold text-blue-600">
                      ৳{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                    </div>
                  </div>
                </List.Item>
              )}
            />

            <Divider orientation="left" className="mt-6">
              Order Summary
            </Divider>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="space-y-3 max-w-md ml-auto">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    ৳{selectedOrder.subtotal?.toFixed(2) || "0.00"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-medium">
                    ৳{selectedOrder.delivery?.cost?.toFixed(2) || "0.00"}
                  </span>
                </div>

                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-green-500">
                      -৳{selectedOrder.discount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                )}

                <Divider className="my-2" />

                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-blue-600">
                    ৳{selectedOrder.total?.toFixed(2) || "0.00"}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>Payment Method:</span>
                  <span className="font-medium">
                    {selectedOrder.payment?.method?.toUpperCase() || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {selectedOrder.note && (
              <>
                <Divider orientation="left" className="mt-6">
                  Customer Note
                </Divider>
                <Card size="small">
                  <Paragraph className="mb-0">{selectedOrder.note}</Paragraph>
                </Card>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Spin size="large" />
          </div>
        )}
      </Modal>

      {/* Create/Edit Order Drawer */}
      <Drawer
        title={
          <div className="flex items-center">
            {selectedOrder ? (
              <>
                <EditOutlined className="text-blue-500 mr-2" />
                <span>Edit Order #{selectedOrder.orderNo}</span>
              </>
            ) : (
              <>
                <PlusOutlined className="text-green-500 mr-2" />
                <span>Create New Order</span>
              </>
            )}
          </div>
        }
        width={720}
        onClose={() => setIsDrawerVisible(false)}
        visible={isDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
        footer={
          <div className="flex justify-between">
            <Button onClick={() => setIsDrawerVisible(false)}>Cancel</Button>
            <Space>
              <Button onClick={() => form.resetFields()}>Reset</Button>
              <Button onClick={handleSubmit} type="primary" loading={loading}>
                {selectedOrder ? "Update Order" : "Create Order"}
              </Button>
            </Space>
          </div>
        }
        className="order-form-drawer">
        <Form form={form} layout="vertical">
          <Title level={5} className="mb-4">
            Customer Information
          </Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={["customer", "name"]}
                label="Full Name"
                rules={[
                  { required: true, message: "Please enter customer name" },
                ]}>
                <Input
                  placeholder="Customer Name"
                  prefix={<UserOutlined className="text-gray-400" />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={["customer", "phone"]}
                label="Phone Number"
                rules={[
                  { required: true, message: "Please enter phone number" },
                  {
                    pattern: /^[0-9]+$/,
                    message: "Please enter valid phone number",
                  },
                ]}>
                <Input
                  placeholder="Phone Number"
                  prefix={<PhoneOutlined className="text-gray-400" />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={["customer", "address"]}
            label="Delivery Address"
            rules={[{ required: true, message: "Please enter address" }]}>
            <TextArea
              rows={3}
              placeholder="Full delivery address"
              prefix={<EnvironmentOutlined className="text-gray-400" />}
            />
          </Form.Item>

          <Divider />

          <Title level={5} className="mb-4">
            Order Items
          </Title>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    className="mb-4"
                    extra={
                      <Button
                        type="link"
                        danger
                        onClick={() => remove(name)}
                        icon={<DeleteOutlined />}
                      />
                    }>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, "product"]}
                          label="Product"
                          rules={[
                            { required: true, message: "Product is required" },
                          ]}>
                          <Select
                            showSearch
                            placeholder="Select product"
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                              option.children
                                .toLowerCase()
                                .indexOf(input.toLowerCase()) >= 0
                            }>
                            {/* In a real app, you would map through products */}
                            <Option value="6820d9575bfb3ae709fca512">
                              Shahi Zafraan
                            </Option>
                            <Option value="product2">Product 2</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, "size"]}
                          label="Size/Variant">
                          <Input placeholder="Size" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, "quantity"]}
                          label="Quantity"
                          rules={[
                            { required: true, message: "Quantity is required" },
                          ]}>
                          <InputNumber
                            min={1}
                            placeholder="Qty"
                            className="w-full"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, "price"]}
                          label="Unit Price"
                          rules={[
                            { required: true, message: "Price is required" },
                          ]}>
                          <InputNumber
                            min={0}
                            placeholder="Price"
                            className="w-full"
                            formatter={(value) => `৳ ${value}`}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                    className="mt-2">
                    Add Product
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider />

          <Title level={5} className="mb-4">
            Delivery Information
          </Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={["delivery", "type"]}
                label="Delivery Type"
                initialValue="inside">
                <Select>
                  <Option value="inside">Inside City</Option>
                  <Option value="outside">Outside City</Option>
                  <Option value="pickup">Customer Pickup</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={["delivery", "cost"]}
                label="Delivery Cost"
                initialValue={60}>
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(value) => `৳ ${value}`}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Title level={5} className="mb-4">
            Payment Information
          </Title>
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
                  <Option value="bKash">bKash</Option>
                  <Option value="nagad">Nagad</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={["payment", "amount"]}
                label="Amount Paid"
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
                valuePropName="checked"
                initialValue={false}>
                <Switch checkedChildren="Paid" unCheckedChildren="Unpaid" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discount"
                label="Discount Amount"
                initialValue={0}>
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(value) => `৳ ${value}`}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Title level={5} className="mb-4">
            Order Status
          </Title>
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
                <DatePicker
                  style={{ width: "100%" }}
                  showTime
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Order Notes">
            <TextArea
              rows={4}
              placeholder="Any special instructions or notes..."
            />
          </Form.Item>
        </Form>
      </Drawer>
    </motion.div>
  );
};

export default OrderManagement;
