import React from 'react';
import { Card, Row, Col } from 'antd';

export default function OverviewCards({ data }: { data: any[] }) {
  const totalRequests = data.reduce((sum, d) => sum + d.ad_exchange_total_requests, 0);
  const totalImpressions = data.reduce((sum, d) => sum + d.ad_exchange_line_item_level_impressions, 0);
  const totalClicks = data.reduce((sum, d) => sum + d.ad_exchange_line_item_level_clicks, 0);
  const totalPayout = data.reduce((sum, d) => sum + d.payout, 0);
  const avgEcpm = data.length ? totalPayout / (data.length) : 0;

  const cards = [
    { title: 'Total Requests', value: totalRequests },
    { title: 'Impressions / Clicks', value: `${totalImpressions} / ${totalClicks}` },
    { title: 'Total Payout', value: `$${totalPayout.toFixed(2)}` },
    { title: 'Average eCPM', value: `$${avgEcpm.toFixed(2)}` },
  ];

  return (
    <Row gutter={16}>
      {cards.map((c) => (
        <Col span={6} key={c.title}>
          <Card>
            <Card.Meta title={c.title} description={c.value} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
