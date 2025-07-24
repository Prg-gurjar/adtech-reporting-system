import React from 'react';
import { Form, Select, DatePicker, Button } from 'antd';

export default function FiltersPanel({
  dimensions,
  metrics,
  params,
  onChange,
}: {
  dimensions: string[];
  metrics: string[];
  params: any;
  onChange: (p: any) => void;
}) {
  const [form] = Form.useForm();

  const apply = () => {
    const vals = form.getFieldsValue();
    onChange({ ...params, ...vals, page: 1 });
  };

  return (
    <Form layout="inline" form={form} initialValues={params}>
      <Form.Item name="dimensions" label="Dimensions">
        <Select options={dimensions.map((d) => ({ label: d, value: d }))} mode="multiple" />
      </Form.Item>
      <Form.Item name="metrics" label="Metrics">
        <Select options={metrics.map((m) => ({ label: m, value: m }))} mode="multiple" />
      </Form.Item>
      <Form.Item name="dateRange" label="Date Range">
        <DatePicker.RangePicker />
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={apply}>
          Apply
        </Button>
      </Form.Item>
      </Form>
    );
  }