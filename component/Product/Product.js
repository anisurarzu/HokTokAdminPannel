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
  Progress,
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
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [form] = Form.useForm();
  const [sizes, setSizes] = useState([]);
  const [currentSize, setCurrentSize] = useState({
    size: "",
    chest: undefined,
    length: undefined,
    sleeve: undefined,
    shoulder: undefined,
    stock: undefined,
  });

  // Define categories and subcategories
  const categories = {
    Men: [
      "Shirt",
      "Denim Jacket",
      "SOLID Shirt",
      "Check Shirt",
      "DENIM Shirt",
      "Paijama",
      "Panjabi",
    ],
    Women: ["Dresses", "Tops", "Bottoms", "Accessories"],
    Kids: ["Boys", "Girls", "Infants"],
  };

  const [availableSubCategories, setAvailableSubCategories] = useState([]);

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

  const handleCategoryChange = (category) => {
    setAvailableSubCategories(categories[category] || []);
    form.setFieldsValue({ subCategory: undefined }); // Reset subCategory when category changes
  };

  const handleUpload = async (file, index) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      setUploadProgress((prev) => ({ ...prev, [index]: 0 }));

      const response = await fetch(
        "https://api.imgbb.com/1/upload?key=469a04307304348b89f3e402eb9bf96f",
        {
          method: "POST",
          body: formData,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress((prev) => ({
              ...prev,
              [index]: percentCompleted,
            }));
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setImageUrls((prev) => [...prev, data.data.url]);
        return data.data.url;
      }
      throw new Error("Image upload failed");
    } catch (error) {
      message.error(`Image upload failed: ${error.message}`);
      return "";
    } finally {
      setUploading(false);
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[index];
        return newProgress;
      });
    }
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must smaller than 2MB!");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const addSize = () => {
    if (
      !currentSize.size ||
      !currentSize.chest ||
      !currentSize.length ||
      !currentSize.sleeve ||
      !currentSize.shoulder ||
      currentSize.stock === undefined
    ) {
      message.error("Please fill all size fields including stock");
      return;
    }
    setSizes([...sizes, currentSize]);
    setCurrentSize({
      size: "",
      chest: undefined,
      length: undefined,
      sleeve: undefined,
      shoulder: undefined,
      stock: undefined,
    });
  };

  const removeSize = (index) => {
    const newSizes = [...sizes];
    newSizes.splice(index, 1);
    setSizes(newSizes);
  };

  const removeImage = (index) => {
    const newImages = [...imageUrls];
    newImages.splice(index, 1);
    setImageUrls(newImages);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      values.images = imageUrls;
      values.sizes = sizes;

      if (imageUrls.length === 0 || imageUrls.length > 3) {
        message.error("Please upload 1-3 product images");
        return;
      }

      if (sizes.length === 0) {
        message.error("Please add at least one size");
        return;
      }

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
      setImageUrls([]);
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
    setImageUrls(product.images);
    setSizes(product.sizes);
    form.setFieldsValue({
      ...product,
      sizes: undefined, // We handle sizes separately
    });
    // Set available subcategories based on current category
    setAvailableSubCategories(categories[product.category] || []);
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
      title: "Images",
      dataIndex: "images",
      key: "images",
      render: (images) => (
        <div style={{ display: "flex", gap: "8px" }}>
          {images.slice(0, 3).map((image, index) => (
            <img
              key={index}
              src={image}
              alt="product"
              style={{ width: 50, height: 50, objectFit: "cover" }}
            />
          ))}
        </div>
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
      title: "Sub Category",
      dataIndex: "subCategory",
      key: "subCategory",
      render: (subCategory) => subCategory || "-",
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
      dataIndex: "sizes",
      key: "stock",
      render: (sizes) => {
        const totalStock = sizes.reduce(
          (sum, size) => sum + (size.stock || 0),
          0
        );
        return (
          <Tag color={totalStock > 0 ? "green" : "red"}>
            {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
          </Tag>
        );
      },
    },
    {
      title: "Sizes",
      dataIndex: "sizes",
      key: "sizes",
      render: (sizes) => (
        <div>
          {sizes.map((size, index) => (
            <Tag key={index}>
              {size.size} (Qty: {size.stock})
            </Tag>
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
              setImageUrls([]);
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
        okText={editMode ? "Update" : "Create"}
        confirmLoading={uploading}>
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
                <Select
                  placeholder="Select category"
                  onChange={handleCategoryChange}>
                  {Object.keys(categories).map((category) => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="subCategory" label="Sub Category">
                <Select
                  placeholder="Select sub category"
                  allowClear
                  showSearch
                  optionFilterProp="children">
                  {availableSubCategories.map((subCat) => (
                    <Option key={subCat} value={subCat}>
                      {subCat}
                    </Option>
                  ))}
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
            label="Product Images"
            extra="Upload 1-3 product images (max 2MB each)">
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {imageUrls.map((url, index) => (
                <div key={index} style={{ position: "relative" }}>
                  <img
                    src={url}
                    alt="product"
                    style={{ width: 100, height: 100, objectFit: "cover" }}
                  />
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeImage(index)}
                    style={{ position: "absolute", top: 0, right: 0 }}
                  />
                </div>
              ))}
              {imageUrls.length < 3 && (
                <Upload
                  name="image"
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  customRequest={async ({ file, onSuccess, onError }) => {
                    try {
                      const url = await handleUpload(file, imageUrls.length);
                      onSuccess(url, file);
                    } catch (error) {
                      onError(error);
                    }
                  }}
                  disabled={uploading || imageUrls.length >= 3}>
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              )}
            </div>
            {Object.keys(uploadProgress).map((key) => (
              <Progress
                key={key}
                percent={uploadProgress[key]}
                status="active"
                style={{ width: "100%" }}
              />
            ))}
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please input description!" }]}>
            <TextArea rows={4} placeholder="Enter product description" />
          </Form.Item>

          <Divider orientation="left">Product Sizes & Stock</Divider>

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
              <Col span={3}>
                <InputNumber
                  placeholder="Chest"
                  style={{ width: "100%" }}
                  value={currentSize.chest}
                  onChange={(value) =>
                    setCurrentSize({ ...currentSize, chest: value })
                  }
                />
              </Col>
              <Col span={3}>
                <InputNumber
                  placeholder="Length"
                  style={{ width: "100%" }}
                  value={currentSize.length}
                  onChange={(value) =>
                    setCurrentSize({ ...currentSize, length: value })
                  }
                />
              </Col>
              <Col span={3}>
                <InputNumber
                  placeholder="Sleeve"
                  style={{ width: "100%" }}
                  value={currentSize.sleeve}
                  onChange={(value) =>
                    setCurrentSize({ ...currentSize, sleeve: value })
                  }
                />
              </Col>
              <Col span={3}>
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
                <InputNumber
                  placeholder="Stock"
                  style={{ width: "100%" }}
                  min={0}
                  value={currentSize.stock}
                  onChange={(value) =>
                    setCurrentSize({ ...currentSize, stock: value })
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
                <span>Stock: {size.stock}</span>
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeSize(index)}
                />
              </Space>
            </Card>
          ))}
        </Form>
      </Modal>
    </div>
  );
};

export default Product;
