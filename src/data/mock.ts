import { LeadRecord, PersonnelRecord } from '../types';

export const mockLeads: LeadRecord[] = [
  { id: 'L001', leadName: '资产转出业务改造', customerName: '北汽汽车金融', person: '田军', isReported: true, reportStatus: '已回传-音视频-已处理-正常分析-生成视频', groupCount: 3, remarks: '方案沟通' },
  { id: 'L002', leadName: '金融监管综合系统', customerName: '成都金融办', person: '段旺东', isReported: true, reportStatus: '已回传-音视频-已处理-正常分析-生成视频', groupCount: 2 },
  { id: 'L003', leadName: '一表通建设', customerName: '第一银行上海', person: '谢明皓', isReported: true, reportStatus: '已回传-音视频-已处理-正常分析-生成视频', groupCount: 1 },
  { id: 'L004', leadName: '外汇展业新建', customerName: '徽商银行', person: '梁宏', isReported: true, reportStatus: '未回传', groupCount: 0, remarks: '客户未录音' },
  { id: 'L005', leadName: '一表通系统新建', customerName: '韩国农协', person: '田炳香', isReported: true, reportStatus: '已回传-截图', groupCount: 1 },
  { id: 'L006', leadName: '交易序号接口改造', customerName: '德意志银行', person: '莫京豫', isReported: true, reportStatus: '已回传-已中标', groupCount: 2 },
  { id: 'L007', leadName: '手机银行UI改版', customerName: '中国银行', person: '曹可心', isReported: true, reportStatus: '已回传-音视频-已处理-角色判定', groupCount: 4 },
  { id: 'L008', leadName: '信贷系统重构', customerName: '交通银行', person: '张伟', isReported: true, reportStatus: '已回传-音视频-已处理-正常进行', groupCount: 2 },
  { id: 'L009', leadName: '风控模型升级', customerName: '招商银行', person: '李芳', isReported: true, reportStatus: '已回传-音视频-无法处理', groupCount: 1, remarks: '音频杂音太大' },
  { id: 'L010', leadName: '核心系统迁移', customerName: '民生银行', person: '王强', isReported: true, reportStatus: '已回传-音视频-已处理-正常分析-处理中', groupCount: 3 },
  { id: 'L011', leadName: '企业网银二期', customerName: '浦发银行', person: '陈静', isReported: true, reportStatus: '未回传', groupCount: 1 },
  { id: 'L012', leadName: '现金管理平台', customerName: '中信银行', person: '周杰', isReported: true, reportStatus: '已回传-截图', groupCount: 5 },
  // 未报备数据
  { id: 'L013', leadName: '反洗钱模块升级', customerName: '工商银行', person: '张瑶瑶', isReported: false, reportStatus: '未报备', groupCount: 0 },
  { id: 'L014', leadName: '云平台迁移', customerName: '建设银行', person: '张苗苗', isReported: false, reportStatus: '未报备', groupCount: 0 },
  { id: 'L015', leadName: '大数据湖搭建', customerName: '农业银行', person: '王凤朝', isReported: false, reportStatus: '未报备', groupCount: 0 },
  { id: 'L016', leadName: '营销系统改造', customerName: '平安银行', person: '张伟', isReported: false, reportStatus: '未报备', groupCount: 0 },
  { id: 'L017', leadName: '渠道整合项目', customerName: '光大银行', person: '李芳', isReported: false, reportStatus: '未报备', groupCount: 0 },
  { id: 'L018', leadName: '数据治理项目', customerName: '华夏银行', person: '李芳', isReported: false, reportStatus: '未报备', groupCount: 0 },
  { id: 'L019', leadName: 'CRM升级', customerName: '广发银行', person: '张瑶瑶', isReported: false, reportStatus: '未报备', groupCount: 0 },
];

export const mockPersonnel: PersonnelRecord[] = [
  { name: '张瑶瑶', department: '销售一部', isFixedMember: true, involvedGroups: 27, speakingGroups: 24, totalMessages: 1250 },
  { name: '张苗苗', department: '销售二部', isFixedMember: true, involvedGroups: 27, speakingGroups: 27, totalMessages: 1420 },
  { name: '王凤朝', department: '销售三部', isFixedMember: true, involvedGroups: 27, speakingGroups: 12, totalMessages: 450 },
  { name: '曹可心', department: '项目组', isFixedMember: true, involvedGroups: 27, speakingGroups: 25, totalMessages: 980 },
  { name: '田军', department: '大客户部', isFixedMember: false, involvedGroups: 15, speakingGroups: 10, totalMessages: 320 },
  { name: '段旺东', department: '华东区', isFixedMember: false, involvedGroups: 12, speakingGroups: 8, totalMessages: 210 },
  { name: '谢明皓', department: '华南区', isFixedMember: false, involvedGroups: 8, speakingGroups: 5, totalMessages: 150 },
  { name: '梁宏', department: '华北区', isFixedMember: false, involvedGroups: 6, speakingGroups: 2, totalMessages: 45 },
  { name: '张伟', department: '销售二部', isFixedMember: false, involvedGroups: 10, speakingGroups: 6, totalMessages: 180 },
  { name: '李芳', department: '销售五部', isFixedMember: false, involvedGroups: 18, speakingGroups: 15, totalMessages: 560 },
  { name: '王强', department: '销售三部', isFixedMember: false, involvedGroups: 14, speakingGroups: 9, totalMessages: 290 },
  { name: '陈静', department: '销售一部', isFixedMember: false, involvedGroups: 11, speakingGroups: 4, totalMessages: 110 },
  { name: '周杰', department: '大客户组', isFixedMember: true, involvedGroups: 35, speakingGroups: 30, totalMessages: 2800 },
];
