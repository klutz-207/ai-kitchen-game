import React from 'react';

const labels = {
  satisfaction: '满意度',
  creativity: '创意度',
  rarity: '稀有度',
};

export function ScoreBars({ scores }) {
  return (
    <div className="score-bars">
      {Object.entries(scores).map(([key, value]) => (
        <div className="score-row" key={key}>
          <span>{labels[key]}</span>
          <div>
            <i style={{ width: `${value}%` }} />
          </div>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
