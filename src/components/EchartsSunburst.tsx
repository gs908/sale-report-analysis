import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Radio } from 'antd';

interface EchartsSunburstProps {
  data: any[];
  onNodeSelect: (nodeName: string) => void;
  selectedNode: string;
  currentPath?: string[];
}

const EchartsSunburst: React.FC<EchartsSunburstProps> = ({ data, onNodeSelect, selectedNode, currentPath = [] }) => {
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
    <div className="w-full flex flex-col h-[500px] relative">
      <div className="absolute top-0 left-0 z-10 p-2 pointer-events-none">
        {/* Left: Breadcrumbs Drill-down */}
        <div className="flex flex-wrap items-center gap-1.5 text-[14px] pointer-events-auto">
          <span className="text-[12px] font-bold text-slate-400 mr-1 flex items-center gap-1">下钻链路:</span>
          {currentPath.map((item, idx) => {
            const isLast = idx === currentPath.length - 1;
            const nodeValue = item === '全量数据' ? 'All' : item;
            return (
              <React.Fragment key={item}>
                {idx > 0 && <span className="text-slate-300 font-light">&gt;</span>}
                <button 
                  onClick={() => onNodeSelect(nodeValue)}
                  className={`transition-colors ${isLast ? "text-blue-600 font-bold" : "text-slate-500 hover:text-blue-500 hover:bg-blue-50 px-1.5 py-0.5 -mx-1.5 rounded"}`}
                >
                  {item}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 right-0 z-10 p-2 pointer-events-none">
        {/* Right Bottom: Layout Button Group */}
        <Radio.Group 
          value={ringStyle} 
          onChange={(e) => setRingStyle(e.target.value)} 
          size="small"
          optionType="button"
          buttonStyle="solid"
          className="shadow-sm shrink-0 pointer-events-auto"
        >
          <Radio.Button value="equal">等宽 (标准)</Radio.Button>
          <Radio.Button value="wider">向外渐宽 (推荐)</Radio.Button>
          <Radio.Button value="narrower">向外渐窄 (聚焦)</Radio.Button>
        </Radio.Group>
      </div>

      <div className="flex-1 relative w-full h-full mt-8 mb-6">
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
