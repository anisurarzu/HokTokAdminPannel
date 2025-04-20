import { useState, useEffect } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  Typography,
  Alert,
  Spin,
  Select,
  message,
} from "antd";
import {
  ShoppingCartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  BarChartOutlined,
  CalendarOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { Formik, Form, Field } from "formik";

dayjs.extend(isBetween);

const { Title } = Typography;
const { Option } = Select;

const DashboardHome = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [storeInfo, setStoreInfo] = useState([]);
  const [products, setProducts] = useState([]);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const userStoreID = userInfo?.storeID;

  useEffect(() => {
    fetchStoreInfo();
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await coreAxios.get("/product");
      if (response.status === 200) {
        setProducts(response.data);
      }
    } catch (error) {
      message.error("Failed to fetch products.");
    }
  };

  const fetchOrders = async () => {
    setLoading2(true);
    try {
      const response = await coreAxios.get("/orders");
      if (response.status === 200) {
        // Handle both array and paginated response
        const ordersData = Array.isArray(response.data)
          ? response.data
          : response.data.orders || [];
        setOrders(ordersData);
      }
    } catch (error) {
      message.error("Failed to fetch orders.");
      setOrders([]);
    } finally {
      setLoading2(false);
    }
  };

  const fetchStoreInfo = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const userRole = userInfo?.role?.value;
      const userStoreID = userInfo?.storeID;

      const response = await coreAxios.get("stores");

      if (Array.isArray(response.data)) {
        let filteredStores = response.data;

        if (userRole === "storeadmin" && userStoreID) {
          filteredStores = filteredStores.filter(
            (store) => store.storeID === userStoreID
          );
        }

        setStoreInfo(filteredStores);
      } else {
        setStoreInfo([]);
      }
    } catch (error) {
      message.error("Failed to fetch store information.");
    }
  };

  // Filter orders by store if storeID is selected
  const filterOrdersByStore = (storeID) => {
    if (!storeID || storeID === 0) return orders;
    return orders.filter((order) => order.storeID === storeID);
  };

  // Calculate various order metrics
  const calculateOrderStats = (ordersToCalculate) => {
    const todayStart = dayjs().startOf("day");
    const todayEnd = dayjs().endOf("day");
    const thirtyDaysAgo = dayjs().subtract(30, "day").startOf("day");

    return {
      totalOrders: ordersToCalculate.length,
      todaysOrders: ordersToCalculate.filter((order) => {
        const orderDate = dayjs(order.status?.orderDate || order.createTime);
        return orderDate.isBetween(todayStart, todayEnd, null, "[]");
      }).length,
      deliveredOrders: ordersToCalculate.filter(
        (order) => order.status?.type === "delivered"
      ).length,
      totalSales: ordersToCalculate.reduce(
        (sum, order) => sum + (order.total || 0),
        0
      ),
      todaysSales: ordersToCalculate
        .filter((order) => {
          const orderDate = dayjs(order.status?.orderDate || order.createTime);
          return orderDate.isBetween(todayStart, todayEnd, null, "[]");
        })
        .reduce((sum, order) => sum + (order.total || 0), 0),
      last30DaysSales: ordersToCalculate
        .filter((order) => {
          const orderDate = dayjs(order.status?.orderDate || order.createTime);
          return orderDate.isBetween(thirtyDaysAgo, todayEnd, null, "[]");
        })
        .reduce((sum, order) => sum + (order.total || 0), 0),
    };
  };

  const [selectedStoreID, setSelectedStoreID] = useState(userStoreID || 0);
  const filteredOrders = filterOrdersByStore(selectedStoreID);
  const {
    totalOrders,
    todaysOrders,
    deliveredOrders,
    totalSales,
    todaysSales,
    last30DaysSales,
  } = calculateOrderStats(filteredOrders);

  const totalProducts = products.length;

  return (
    <div>
      {loading ? (
        <Spin tip="Loading...">
          <Alert
            message="Loading Dashboard"
            description="Please wait while we load your dashboard data."
            type="info"
          />
        </Spin>
      ) : (
        <div>
          <div className="mb-6">
            <Formik
              initialValues={{ storeID: selectedStoreID }}
              onSubmit={(values) => {}}>
              {({ setFieldValue, values }) => (
                <Form>
                  <Field name="storeID">
                    {({ field }) => (
                      <Select
                        {...field}
                        placeholder="Select a Store"
                        value={values.storeID}
                        style={{ width: 300 }}
                        onChange={(value) => {
                          setFieldValue("storeID", value);
                          setSelectedStoreID(value);
                        }}>
                        <Option key={0} value={0}>
                          All Stores
                        </Option>
                        {storeInfo.map((store) => (
                          <Option key={store.storeID} value={store.storeID}>
                            {store.storeName}
                          </Option>
                        ))}
                      </Select>
                    )}
                  </Field>
                </Form>
              )}
            </Formik>
          </div>

          <Title
            level={2}
            className="mb-2 lg:mb-4 text-[#2B7490] text-center lg:text-left">
            <ShopOutlined className="mr-2" />
            HOKTOK Store Dashboard
          </Title>

          {loading2 ? (
            <Spin tip="Loading...">
              <Alert
                message="Loading Sales Data"
                description="Please wait while we load your sales information."
                type="info"
              />
            </Spin>
          ) : (
            <div>
              <Row gutter={[16, 24]} className="mb-6">
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card
                    style={{
                      backgroundColor: "#2B7490",
                      borderColor: "#2B7490",
                    }}>
                    <Statistic
                      title={
                        <span className="text-white">
                          <InboxOutlined className="mr-2" />
                          Total Orders
                        </span>
                      }
                      value={totalOrders}
                      valueStyle={{ color: "white" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card
                    style={{
                      backgroundColor: "#2B7490",
                      borderColor: "#2B7490",
                    }}>
                    <Statistic
                      title={
                        <span className="text-white">
                          <ShoppingCartOutlined className="mr-2" />
                         {`Today's Orders`}
                        </span>
                      }
                      value={todaysOrders}
                      valueStyle={{ color: "white" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card
                    style={{
                      backgroundColor: "#2B7490",
                      borderColor: "#2B7490",
                    }}>
                    <Statistic
                      title={
                        <span className="text-white">
                          <ShopOutlined className="mr-2" />
                          Total Products
                        </span>
                      }
                      value={totalProducts}
                      valueStyle={{ color: "white" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card
                    style={{
                      backgroundColor: "#2B7490",
                      borderColor: "#2B7490",
                    }}>
                    <Statistic
                      title={
                        <span className="text-white">
                          <CheckCircleOutlined className="mr-2" />
                          Delivered Orders
                        </span>
                      }
                      value={deliveredOrders}
                      valueStyle={{ color: "white" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card
                    style={{
                      backgroundColor: "#2B7490",
                      borderColor: "#2B7490",
                    }}>
                    <Statistic
                      title={
                        <span className="text-white">
                          <DollarOutlined className="mr-2" />
                          Total Sales
                        </span>
                      }
                      value={totalSales.toFixed(2)}
                      prefix="৳"
                      valueStyle={{ color: "white" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card
                    style={{
                      backgroundColor: "#2B7490",
                      borderColor: "#2B7490",
                    }}>
                    <Statistic
                      title={
                        <span className="text-white">
                          <BarChartOutlined className="mr-2" />
                        {`Today's Sales`}
                        </span>
                      }
                      value={todaysSales.toFixed(2)}
                      prefix="৳"
                      valueStyle={{ color: "white" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card
                    style={{
                      backgroundColor: "#2B7490",
                      borderColor: "#2B7490",
                    }}>
                    <Statistic
                      title={
                        <span className="text-white">
                          <CalendarOutlined className="mr-2" />
                          30 Days Sales
                        </span>
                      }
                      value={last30DaysSales.toFixed(2)}
                      prefix="৳"
                      valueStyle={{ color: "white" }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
