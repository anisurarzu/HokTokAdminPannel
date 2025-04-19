"use client";

import { Layout, Menu, Button, Spin, Drawer, Avatar } from "antd";
import {
  DashboardOutlined,
  UsergroupAddOutlined,
  ShoppingOutlined,
  LogoutOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import DashboardHome from "@/component/DashboardHome";
import AgentInformation from "@/component/AgentInformation";
import Product from "@/component/Product/Product";

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: "1",
    label: "Dashboard",
    icon: <DashboardOutlined />,
    component: <DashboardHome />,
  },
  {
    key: "2",
    label: "Products",
    icon: <ShoppingOutlined />,
    component: <Product />,
  },
  {
    key: "3",
    label: "Users",
    icon: <UsergroupAddOutlined />,
    component: <AgentInformation />,
  },
];

const Dashboard = ({ sliders }) => {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("1");
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }

    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [router, selectedMenu]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    router.push("/login");
  };

  const showDrawer = () => setVisible(true);
  const onClose = () => setVisible(false);

  const renderContent = () => {
    const selectedPage = menuItems.find((page) => page.key === selectedMenu);
    return selectedPage ? selectedPage.component : <div>Page not found</div>;
  };

  return (
    <Layout className="min-h-screen">
      {/* Sidebar for Desktop */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={250}
        style={{
          backgroundColor: "#2B7490",
          borderRight: "1px solid #e8e8e8",
        }}
        className="hidden lg:block">
        <div className="logo-container py-4 flex items-center justify-center bg-white">
          <Image
            src="/images/logo.png"
            alt="HOKTOK Logo"
            width={collapsed ? 50 : 180}
            height={collapsed ? 25 : 50}
          />
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedMenu]}
          onClick={(e) => setSelectedMenu(e.key)}
          className="bg-white">
          {menuItems.map((page) => (
            <Menu.Item
              key={page.key}
              icon={page.icon}
              className="bg-white hover:bg-gray-100"
              style={{
                color: "#2B7490",
                fontWeight: "500",
              }}>
              {page.label}
            </Menu.Item>
          ))}
        </Menu>
      </Sider>

      {/* Drawer for Mobile */}
      <Drawer
        title={<div className="text-2B7490 font-bold">HOKTOK Menu</div>}
        placement="left"
        onClose={onClose}
        open={visible}
        width="75vw"
        headerStyle={{
          backgroundColor: "#2B7490",
          color: "white",
        }}
        bodyStyle={{ padding: 0 }}>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedMenu]}
          onClick={(e) => {
            setSelectedMenu(e.key);
            onClose();
          }}
          className="bg-white">
          {menuItems.map((page) => (
            <Menu.Item
              key={page.key}
              icon={page.icon}
              className="bg-white hover:bg-gray-100"
              style={{
                color: "#2B7490",
                fontWeight: "500",
              }}>
              {page.label}
            </Menu.Item>
          ))}
        </Menu>
      </Drawer>

      <Layout className="site-layout">
        <Header
          style={{
            backgroundColor: "#2B7490",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          }}
          className="flex justify-between items-center px-4 lg:px-8 py-4">
          <Button
            icon={<MenuOutlined style={{ color: "white" }} />}
            className="lg:hidden border-none bg-transparent"
            onClick={showDrawer}
          />
          <h1 className="text-xl lg:text-2xl font-bold text-white">
            HOKTOK Admin Panel
          </h1>
          <div className="flex items-center space-x-4">
            {userInfo && (
              <div className="relative flex items-center space-x-2">
                <Avatar
                  src={userInfo.image}
                  alt={userInfo.username}
                  size={40}
                  className="hidden lg:block border-2 border-white"
                />
                <span className="text-white hidden lg:inline-block">
                  {userInfo.username}
                </span>
              </div>
            )}
            <Button
              icon={<LogoutOutlined />}
              type="primary"
              style={{
                backgroundColor: "#1a5a7a",
                borderColor: "#1a5a7a",
              }}
              onClick={handleLogout}>
              <span className="hidden lg:inline-block">Logout</span>
            </Button>
          </div>
        </Header>

        <Content
          className="m-4 lg:m-6 p-4 lg:p-6 bg-white rounded-lg shadow-sm"
          style={{
            backgroundColor: "#f5f7fa",
            minHeight: "calc(100vh - 64px - 32px)",
          }}>
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Spin size="large" />
            </div>
          ) : (
            renderContent()
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
