import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  message,
  Table,
  Space,
  Modal,
  Image,
  Card,
  Progress,
} from "antd";
import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";

const { TextArea } = Input;

const StoryTemp = () => {
  const [form] = Form.useForm();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStory, setCurrentStory] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Fetch all stories
  const fetchStories = async () => {
    setLoading(true);
    try {
      const response = await coreAxios.get("/stories");
      setStories(response.data);
    } catch (error) {
      message.error("Failed to fetch stories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Upload image to ImgBB
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

  const removeImage = (index) => {
    const newImages = [...imageUrls];
    newImages.splice(index, 1);
    setImageUrls(newImages);
  };

  // Handle form submit
  const onFinish = async (values) => {
    try {
      if (imageUrls.length === 0 || imageUrls.length > 3) {
        message.error("Please upload 1-3 images");
        return;
      }

      const storyData = {
        title: values.title,
        subtitle: values.subtitle,
        description: values.description,
        otherDescription: values.otherDescription || null, // Non-required field
        images: imageUrls,
      };

      setLoading(true);
      if (currentStory) {
        await coreAxios.put(`/stories/${currentStory._id}`, storyData);
        message.success("Story updated successfully");
      } else {
        await coreAxios.post("/stories", storyData);
        message.success("Story created successfully");
      }

      form.resetFields();
      setImageUrls([]);
      fetchStories();
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to save story");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (story) => {
    setCurrentStory(story);
    setImageUrls(story.images);
    form.setFieldsValue({
      title: story.title,
      subtitle: story.subtitle,
      description: story.description,
      otherDescription: story.otherDescription,
    });
    setIsModalVisible(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await coreAxios.delete(`/stories/${id}`);
      message.success("Story deleted successfully");
      fetchStories();
    } catch (error) {
      message.error("Failed to delete story");
    } finally {
      setLoading(false);
    }
  };

  // Handle preview
  const handlePreview = (url) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

  // Columns for table
  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Subtitle",
      dataIndex: "subtitle",
      key: "subtitle",
    },
    {
      title: "Images",
      dataIndex: "images",
      key: "images",
      render: (images) => (
        <div style={{ display: "flex", gap: "8px" }}>
          {images.slice(0, 3).map((img, index) => (
            <Image
              key={index}
              src={img}
              width={50}
              height={50}
              style={{ objectFit: "cover" }}
              preview={false}
              onClick={() => handlePreview(img)}
            />
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
            icon={<EyeOutlined />}
            onClick={() => {
              setCurrentStory(record);
              setIsModalVisible(true);
            }}
          />
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Story Management"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setCurrentStory(null);
            form.resetFields();
            setImageUrls([]);
            setIsModalVisible(true);
          }}>
          Add New Story
        </Button>
      }>
      <Table
        columns={columns}
        dataSource={stories}
        rowKey="_id"
        loading={loading}
      />

      <Modal
        title={currentStory ? "Edit Story" : "Add New Story"}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please input the title!" }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="subtitle"
            label="Subtitle"
            rules={[{ required: true, message: "Please input the subtitle!" }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please input the description!" },
            ]}>
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="otherDescription"
            label="Additional Description (Optional)">
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item
            label="Images (Max 3)"
            extra="Upload 1-3 story images (max 2MB each)">
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {imageUrls.map((url, index) => (
                <div key={index} style={{ position: "relative" }}>
                  <img
                    src={url}
                    alt="story"
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
                      if (url) {
                        onSuccess(url, file);
                      } else {
                        onError(new Error("Upload failed"));
                      }
                    } catch (error) {
                      onError(error);
                    }
                  }}
                  disabled={uploading || imageUrls.length >= 3}>
                  <div>
                    {uploading ? (
                      "Uploading..."
                    ) : (
                      <>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>Upload</div>
                      </>
                    )}
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

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading || uploading}>
              {currentStory ? "Update" : "Submit"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        visible={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}>
        <img alt="preview" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </Card>
  );
};

export default StoryTemp;
