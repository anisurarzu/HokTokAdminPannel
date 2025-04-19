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

const { Title } = Typography;
const { Option } = Select;

const DashboardHome = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [storeInfo, setStoreInfo] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const userStoreID = userInfo?.storeID;

  useEffect(() => {
    fetchStoreInfo();
    fetchOrdersByStoreID(userStoreID);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await coreAxios.get("/products");
      if (response.status === 200) {
        setProducts(response.data);
      }
    } catch (error) {
      message.error("Failed to fetch products.");
    }
  };

  const fetchOrdersByStoreID = async (storeID) => {
    setLoading2(true);
    try {
      const response = await coreAxios.post("getOrdersByStoreID", {
        storeID: storeID,
      });
      if (response.status === 200) {
        const filtered = response?.data?.filter(
          (data) => data.statusID !== 255
        );
        setFilteredOrders(filtered);
      }
    } catch (error) {
      setFilteredOrders([]);
      message.error("No orders found for this store.");
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

  const today = dayjs().format("D MMM YYYY");

  // Calculate various order metrics
  const totalOrders = filteredOrders.length;
  const totalProducts = products.length;

  const todaysOrders = filteredOrders.filter((order) => {
    const createTime = dayjs(order.createTime).format("D MMM YYYY");
    return createTime === today;
  }).length;

  const completedOrders = filteredOrders.filter(
    (order) => order.status === "completed"
  ).length;

  const totalSales = filteredOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  const todaysSales = filteredOrders
    .filter((order) => {
      const createTime = dayjs(order.createTime).format("D MMM YYYY");
      return createTime === today;
    })
    .reduce((sum, order) => sum + order.totalAmount, 0);

  dayjs.extend(isBetween);
  const thirtyDaysAgo = dayjs().subtract(30, "day");

  const last30DaysSales = filteredOrders
    .filter((order) => {
      const createTime = dayjs(order.createTime);
      return createTime.isBetween(thirtyDaysAgo, today, "day", "[]");
    })
    .reduce((sum, order) => sum + order.totalAmount, 0);

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
              initialValues={{ storeID: userStoreID || 0 }}
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
                          fetchOrdersByStoreID(value);
                        }}>
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
                          Complete Orders
                        </span>
                      }
                      value={completedOrders}
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
                      value={totalSales}
                      prefix={<DollarOutlined className="text-white" />}
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
                      value={todaysSales}
                      prefix={<DollarOutlined className="text-white" />}
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
                      value={last30DaysSales}
                      prefix={<DollarOutlined className="text-white" />}
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
