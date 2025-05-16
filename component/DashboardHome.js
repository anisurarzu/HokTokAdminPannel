import { useState, useEffect } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  Typography,
  message,
  Skeleton,
  Space,
} from "antd";
import {
  ShoppingCartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  BarChartOutlined,
  CalendarOutlined,
  InboxOutlined,
  RiseOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const { Title, Text } = Typography;

// Modern color palette with gradients
const COLORS = {
  primary: "#1890ff",
  secondary: "#13c2c2",
  success: "#52c41a",
  warning: "#faad14",
  error: "#f5222d",
  purple: "#722ed1",
  magenta: "#eb2f96",
  blue: "#1677ff",
};

const getCardGradient = (color) => {
  const gradients = {
    primary: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
    secondary: "linear-gradient(135deg, #13c2c2 0%, #08979c 100%)",
    success: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
    warning: "linear-gradient(135deg, #faad14 0%, #d48806 100%)",
    error: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
    purple: "linear-gradient(135deg, #722ed1 0%, #531dab 100%)",
    magenta: "linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)",
    blue: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
  };
  return gradients[color] || gradients.primary;
};

const DashboardHome = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersRes, productsRes] = await Promise.all([
          coreAxios.get("/orders"),
          coreAxios.get("/product"),
        ]);

        // Handle the nested orders structure
        const ordersData = Array.isArray(ordersRes.data)
          ? ordersRes.data
          : ordersRes.data.orders || [];
        setOrders(ordersData);

        setProducts(productsRes.data || []);
      } catch (error) {
        message.error("Failed to fetch dashboard data");
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      pendingOrders: ordersToCalculate.filter(
        (order) => order.status?.type === "pending"
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
      avgOrderValue:
        ordersToCalculate.length > 0
          ? ordersToCalculate.reduce(
              (sum, order) => sum + (order.total || 0),
              0
            ) / ordersToCalculate.length
          : 0,
    };
  };

  const {
    totalOrders,
    todaysOrders,
    deliveredOrders,
    pendingOrders,
    totalSales,
    todaysSales,
    last30DaysSales,
    avgOrderValue,
  } = calculateOrderStats(orders);

  const totalProducts = products.length;

  const StatisticCard = ({
    title,
    value,
    icon,
    color = "primary",
    prefix,
    suffix,
    precision = 0,
  }) => (
    <Card
      style={{
        background: getCardGradient(color),
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        border: "none",
        height: "100%",
      }}
      bodyStyle={{ padding: "16px 20px" }}>
      <Statistic
        title={
          <Text style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 14 }}>
            <Space size={8}>
              {icon}
              {title}
            </Space>
          </Text>
        }
        value={value}
        prefix={prefix}
        suffix={suffix}
        precision={precision}
        valueStyle={{
          color: "#fff",
          fontWeight: 600,
          fontSize: 24,
        }}
      />
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={3} style={{ marginBottom: 0 }}>
          Dashboard Overview
        </Title>

        {loading ? (
          <Row gutter={[16, 16]}>
            {[...Array(8)].map((_, i) => (
              <Col key={i} xs={24} sm={12} md={8} lg={6}>
                <Card>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <StatisticCard
                  title="Total Orders"
                  value={totalOrders}
                  icon={<InboxOutlined />}
                  color="blue"
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <StatisticCard
                  title="Today's Orders"
                  value={todaysOrders}
                  icon={<ShoppingCartOutlined />}
                  color="success"
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <StatisticCard
                  title="Total Products"
                  value={totalProducts}
                  icon={<ShopOutlined />}
                  color="purple"
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <StatisticCard
                  title="Delivered Orders"
                  value={deliveredOrders}
                  icon={<CheckCircleOutlined />}
                  color="secondary"
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <StatisticCard
                  title="Pending Orders"
                  value={pendingOrders}
                  icon={<TeamOutlined />}
                  color="warning"
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <StatisticCard
                  title="Total Sales"
                  value={totalSales}
                  icon={<DollarOutlined />}
                  color="magenta"
                  prefix="৳"
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <StatisticCard
                  title="Today's Sales"
                  value={todaysSales}
                  icon={<BarChartOutlined />}
                  color="error"
                  prefix="৳"
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <StatisticCard
                  title="30 Days Sales"
                  value={last30DaysSales}
                  icon={<CalendarOutlined />}
                  color="primary"
                  prefix="৳"
                  precision={2}
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={24} md={12} lg={12}>
                <StatisticCard
                  title="Average Order Value"
                  value={avgOrderValue}
                  icon={<RiseOutlined />}
                  color="success"
                  prefix="৳"
                  precision={2}
                />
              </Col>
            </Row>
          </>
        )}
      </Space>
    </div>
  );
};

export default DashboardHome;
