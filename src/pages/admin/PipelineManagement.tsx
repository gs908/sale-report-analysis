import React, { useState } from 'react';
import { Table, Button, Space, Tag, Modal, Input, notification, Steps } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

interface PipelineTask {
  id: string;
  leadName: string;
  groupName: string;
  status: number; // 0: 音频处理, 1: 报告生成, 2: 视频生成, 3: 完成
  outputs: {
    audioText: string;
    reportContent: string;
    videoUrl: string;
  }
}

const mockTasks: PipelineTask[] = [
  { 
    id: 'T101', leadName: '资产转出业务改造', groupName: '北京银行建设沟通交流群', status: 1, 
    outputs: { audioText: '客户对现在的系统响应速度很不满，希望重写架构。', reportContent: '', videoUrl: '' } 
  },
  { 
    id: 'T102', leadName: '信贷系统重构', groupName: '交行信贷重构沟通群', status: 3, 
    outputs: { 
       audioText: '交行的信贷需要分布式重构。', 
       reportContent: '交行信贷重构方案：1. 引入微服务。2. 数据库分库分表。', 
       videoUrl: 'https://video.example.com/demo.mp4' 
    } 
  }
];

export default function PipelineManagement() {
  const [data, setData] = useState<PipelineTask[]>(mockTasks);
  const [activeTask, setActiveTask] = useState<PipelineTask | null>(null);
  
  // Modals state
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  
  const [tempAudioText, setTempAudioText] = useState('');
  const [tempReportText, setTempReportText] = useState('');

  const handleOpenAudio = (task: PipelineTask) => {
    setActiveTask(task);
    setTempAudioText(task.outputs.audioText);
    setAudioModalOpen(true);
  };

  const handleOpenReport = (task: PipelineTask) => {
    setActiveTask(task);
    setTempReportText(task.outputs.reportContent);
    setReportModalOpen(true);
  };

  const handleSaveAudio = () => {
    if (activeTask) {
      const updated = { ...activeTask, outputs: { ...activeTask.outputs, audioText: tempAudioText } };
      setData(data.map(t => t.id === updated.id ? updated : t));
      notification.success({ message: '音频文本已更新', description: '下游报告生成将采用最新文本。' });
      setAudioModalOpen(false);
    }
  };

  const handleSaveReport = () => {
    if (activeTask) {
      const updated = { ...activeTask, outputs: { ...activeTask.outputs, reportContent: tempReportText } };
      setData(data.map(t => t.id === updated.id ? updated : t));
      notification.success({ message: '报告内容已更新', description: '下游视频生成将采用最新报告内容。' });
      setReportModalOpen(false);
    }
  };

  const handleRerun = (id: string, stage: number) => {
    notification.info({ message: '任务已重新提交', description: `节点重跑指令已被接收，稍后刷新查看进度。` });
  };

  const columns: ColumnsType<PipelineTask> = [
    { title: '任务ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '线索名称', dataIndex: 'leadName', key: 'leadName' },
    { title: '沟通群', dataIndex: 'groupName', key: 'groupName' },
    {
      title: '流程状态',
      key: 'status',
      width: 400,
      render: (_, record) => (
         <Steps size="small" current={record.status} items={[
            { title: '音频解析' },
            { title: '报告生成' },
            { title: '数字人视频' }
         ]} />
      )
    },
    { 
      title: '节点成果 / 重跑', 
      key: 'action', 
      render: (_, record) => (
        <Space size="small" direction="vertical">
          <div className="flex gap-2">
            <Button size="small" onClick={() => handleOpenAudio(record)}>核对音频文本</Button>
            {record.status > 0 && <Button size="small" onClick={() => handleOpenReport(record)}>核对报告结果</Button>}
          </div>
          <div className="flex gap-2">
             <Button type="dashed" size="small" onClick={() => handleRerun(record.id, 0)}>重跑音频</Button>
             <Button type="dashed" size="small" onClick={() => handleRerun(record.id, 1)}>重跑报告</Button>
             <Button type="dashed" size="small" onClick={() => handleRerun(record.id, 2)}>重跑视频</Button>
          </div>
        </Space>
      ) 
    },
  ];

  return (
    <div>
      <div className="mb-4">
         <h3 className="text-lg font-bold text-slate-800">报告生成管理</h3>
         <p className="text-xs text-slate-500 mt-1">处理链路：音频文本提取 -&gt; 垂直行业报告生成 -&gt; 数字人视频播报生成。各环节可介入人工修正并向下流转。</p>
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" size="middle" />

      {/* Audio Text Modal */}
      <Modal title="审阅并编辑音频解析文本" open={audioModalOpen} onOk={handleSaveAudio} onCancel={() => setAudioModalOpen(false)} width={600}>
         <div className="mb-2 text-xs text-slate-500">此文本将作为下一阶段【报告生成】的原始输入素材。</div>
         <TextArea rows={10} value={tempAudioText} onChange={e => setTempAudioText(e.target.value)} />
      </Modal>

      {/* Report Content Modal */}
      <Modal title="审阅并编辑生成报告" open={reportModalOpen} onOk={handleSaveReport} onCancel={() => setReportModalOpen(false)} width={600}>
         <div className="mb-2 text-xs text-slate-500">此报告内容将作为下一阶段【数字人视频】的朗读剧本输入。</div>
         <TextArea rows={10} value={tempReportText} onChange={e => setTempReportText(e.target.value)} />
      </Modal>
    </div>
  );
}
