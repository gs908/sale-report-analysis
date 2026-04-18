import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Radio } from 'antd';

interface EchartsSunburstProps {
  data: any[];
  onNodeSelect: (nodeName: string) => void;
  selectedNode: string;
}

const EchartsSunburst: React.FC<EchartsSunburstProps> = ({ data, onNodeSelect, selectedNode }) => {
  const [ringStyle, setRingStyle] = useState<'equal' | 'wider' | 'narrower'>('narrower');

  const getSubTitle = () => {
    if (selectedNode === 'All') return '总数据线索透视';
    return `钻取节点：${selectedNode}`;
  };

  const getLevels = () => {
    const commonStyle = { borderWidth: 3, borderColor: '#fff' };
    
    // Config controls the [r0, r] (inner and outer radius) for each of the 6 detailed layers.
    const config = {
      // 1. 等宽 (Equal width): 每一层厚度大约 13%，有稳定的阅读体验
      equal: [
        ['5%', '18%'],  ['20%', '33%'], ['35%', '48%'], 
        ['50%', '63%'], ['65%', '78%'], ['80%', '93%']
      ],
      // 2. 向外渐宽 (Wider outwards): 内圈薄外圈厚，外层节点碎但面积大，更易于展示末端分支文本
      wider: [
        ['5%', '10%'],  ['12%', '19%'], ['21%', '32%'], 
        ['34%', '48%'], ['50%', '68%'], ['70%', '93%']
      ],
      // 3. 向外渐窄 (Narrower outwards): 强调核心分类，越往外越像边缘附加信息
      narrower: [
        ['5%', '28%'],  ['30%', '48%'], ['50%', '64%'], 
        ['66%', '77%'], ['79%', '86%'], ['88%', '93%']
      ]
    };

    const radii = config[ringStyle];

    return [
      {}, 
      // Level 1
      { r0: radii[0][0], r: radii[0][1], itemStyle: commonStyle, label: { rotate: 'tangential' } },
      // Level 2
      { r0: radii[1][0], r: radii[1][1], itemStyle: commonStyle, label: { align: 'right' } },
      // Level 3
      { r0: radii[2][0], r: radii[2][1], itemStyle: commonStyle },
      // Level 4
      { r0: radii[3][0], r: radii[3][1], itemStyle: commonStyle },
      // Level 5
      { r0: radii[4][0], r: radii[4][1], itemStyle: commonStyle },
      // Level 6
      { r0: radii[5][0], r: radii[5][1], itemStyle: commonStyle, label: { position: 'outside', padding: 3, silent: false } }
    ];
  };

  const option = {
    title: {
      text: '线索报备数据枢纽',
      subtext: getSubTitle(),
      textStyle: {
        fontSize: 14,
        align: 'center'
      },
      subtextStyle: {
        align: 'center',
        color: '#3b82f6',
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}个'
    },
    series: {
      type: 'sunburst',
      data: data,
      radius: [0, '95%'],
      itemStyle: {
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#fff'
      },
      label: {
        show: true,
        formatter: '{b}\n{c}', // reduced newline for tighter text in narrow rings
        minAngle: 12 
      },
      emphasis: {
        focus: 'ancestor'
      },
      levels: getLevels()
    }
  };

  const onEvents = {
    click: (e: any) => {
      if (e.data && e.data.name) {
        onNodeSelect(e.data.name);
      }
    }
  };

  return (
    <div className="w-full flex flex-col h-[500px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 mb-3 gap-3">
        <Radio.Group 
          value={ringStyle} 
          onChange={(e) => setRingStyle(e.target.value)} 
          size="small"
          optionType="button"
          buttonStyle="solid"
          className="shadow-sm"
        >
          <Radio.Button value="equal">等宽 (标准)</Radio.Button>
          <Radio.Button value="wider">向外渐宽 (推荐)</Radio.Button>
          <Radio.Button value="narrower">向外渐窄 (聚焦)</Radio.Button>
        </Radio.Group>

        {selectedNode !== 'All' && (
          <button 
            onClick={() => onNodeSelect('All')}
            className="text-[11px] sm:text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors font-medium border border-slate-200"
          >
             返回全局视图 / 重置过滤
          </button>
        )}
      </div>

      <div className="flex-1 relative w-full h-full">
        <ReactECharts
          option={option}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100%', width: '100%' }}
          onEvents={onEvents}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </div>
  );
};

export default EchartsSunburst;
