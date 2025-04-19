import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  message,
  Card,
  Tag,
  Space,
  Popconfirm,
  Row,
  Col,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";

const { Option } = Select;
const { TextArea } = Input;

const Product = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [form] = Form.useForm();
  const [sizes, setSizes] = useState([]);
  const [currentSize, setCurrentSize] = useState({
    size: "",
    chest: undefined,
    length: undefined,
    sleeve: undefined,
    shoulder: undefined,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await coreAxios.get("/product");
      setProducts(response.data);
    } catch (error) {
      message.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        "https://api.imgbb.com/1/upload?key=469a04307304348b89f3e402eb9bf96f",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        setImageUrl(data.data.url);
        return data.data.url;
      }
      throw new Error("Image upload failed");
    } catch (error) {
      message.error("Image upload failed");
      return "";
    }
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must smaller than 2MB!");
    }
    return isJpgOrPng && isLt2M;
  };

  const addSize = () => {
    if (
      !currentSize.size ||
      !currentSize.chest ||
      !currentSize.length ||
      !currentSize.sleeve ||
      !currentSize.shoulder
    ) {
      message.error("Please fill all size fields");
      return;
    }
    setSizes([...sizes, currentSize]);
    setCurrentSize({
      size: "",
      chest: undefined,
      length: undefined,
      sleeve: undefined,
      shoulder: undefined,
    });
  };

  const removeSize = (index) => {
    const newSizes = [...sizes];
    newSizes.splice(index, 1);
    setSizes(newSizes);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      values.image = imageUrl;
      values.sizes = sizes;

      if (sizes.length === 0) {
        message.error("Please add at least one size");
        return;
      }

      // Ensure we have the product ID when in edit mode
      if (editMode && !currentProduct?._id) {
        message.error("Product ID missing");
        return;
      }

      let response;
      if (editMode) {
        response = await coreAxios.put(
          `/product/${currentProduct._id}`,
          values
        );
        message.success("Product updated successfully");
      } else {
        response = await coreAxios.post("/product", values);
        message.success("Product created successfully");
      }

      setModalVisible(false);
      form.resetFields();
      setImageUrl("");
      setSizes([]);
      fetchProducts();
    } catch (error) {
      console.error("Error:", error);
      message.error(
        error.response?.data?.message || error.message || "Operation failed"
      );
    }
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setEditMode(true);
    setImageUrl(product.image);
    setSizes(product.sizes);
    form.setFieldsValue({
      ...product,
      sizes: undefined, // We handle sizes separately
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await coreAxios.delete(`/product/hard/${id}`);
      message.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      message.error("Failed to delete product");
    }
  };

  const columns = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (image) => (
        <img
          src={image}
          alt="product"
          style={{ width: 50, height: 50, objectFit: "cover" }}
        />
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price, record) => (
        <div>
          <div>${price.toFixed(2)}</div>
          {record.discountPrice && (
            <div style={{ textDecoration: "line-through", color: "red" }}>
              ${record.prevPrice?.toFixed(2)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      render: (stock) => (
        <Tag color={stock > 0 ? "green" : "red"}>
          {stock > 0 ? `${stock} in stock` : "Out of stock"}
        </Tag>
      ),
    },
    {
      title: "Sizes",
      dataIndex: "sizes",
      key: "sizes",
      render: (sizes) => (
        <div>
          {sizes.map((size, index) => (
            <Tag key={index}>{size.size}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Are you sure to delete this product?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No">
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Product Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditMode(false);
              setCurrentProduct(null);
              setImageUrl("");
              setSizes([]);
              form.resetFields();
              setModalVisible(true);
            }}>
            Add Product
          </Button>
        }>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="_id"
          loading={loading}
          scroll={{ x: true }}
        />
      </Card>

      <Modal
        title={editMode ? "Edit Product" : "Create Product"}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText={editMode ? "Update" : "Create"}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[
                  { required: true, message: "Please input product name!" },
                ]}>
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[
                  { required: true, message: "Please select category!" },
                ]}>
                <Select placeholder="Select category">
                  <Option value="Men">Men</Option>
                  <Option value="Women">Women</Option>
                  <Option value="Kids">Kids</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Price"
                rules={[{ required: true, message: "Please input price!" }]}>
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Enter price"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="prevPrice" label="Previous Price">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Enter previous price"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discountPrice" label="Discount Price">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Enter discount price"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="image"
            label="Product Image"
            extra="Upload product image (max 2MB)">
            <Upload
              name="image"
              listType="picture-card"
              showUploadList={false}
              beforeUpload={beforeUpload}
              customRequest={async ({ file }) => {
                const url = await handleUpload(file);
                return url;
              }}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="product"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please input description!" }]}>
            <TextArea rows={4} placeholder="Enter product description" />
          </Form.Item>

          <Divider orientation="left">Product Sizes</Divider>

          <div style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={4}>
                <Input
                  placeholder="Size (e.g., S, M)"
                  value={currentSize.size}
                  onChange={(e) =>
                    setCurrentSize({ ...currentSize, size: e.target.value })
                  }
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  placeholder="Chest"
                  style={{ width: "100%" }}
                  value={currentSize.chest}
                  onChange={(value) =>
                    setCurrentSize({ ...currentSize, chest: value })
                  }
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  placeholder="Length"
                  style={{ width: "100%" }}
                  value={currentSize.length}
                  onChange={(value) =>
                    setCurrentSize({ ...currentSize, length: value })
                  }
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  placeholder="Sleeve"
                  style={{ width: "100%" }}
                  value={currentSize.sleeve}
                  onChange={(value) =>
                    setCurrentSize({ ...currentSize, sleeve: value })
                  }
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  placeholder="Shoulder"
                  style={{ width: "100%" }}
                  value={currentSize.shoulder}
                  onChange={(value) =>
                    setCurrentSize({ ...currentSize, shoulder: value })
                  }
                />
              </Col>
              <Col span={4}>
                <Button type="primary" onClick={addSize}>
                  Add Size
                </Button>
              </Col>
            </Row>
          </div>

          {sizes.map((size, index) => (
            <Card key={index} style={{ marginBottom: 8 }}>
              <Space>
                <Tag>{size.size}</Tag>
                <span>Chest: {size.chest}</span>
                <span>Length: {size.length}</span>
                <span>Sleeve: {size.sleeve}</span>
                <span>Shoulder: {size.shoulder}</span>
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeSize(index)}
                />
              </Space>
            </Card>
          ))}

          <Form.Item
            name="stock"
            label="Total Stock"
            rules={[
              { required: true, message: "Please input stock quantity!" },
            ]}>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="Enter total stock quantity"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Product;
