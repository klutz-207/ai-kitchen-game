import React from 'react';
import { RefreshCw } from 'lucide-react';
import { PixelButton } from './PixelButton';

export function DishCard({ dish, index, loading = false, onRedo, onEmptyClick }) {
  if (loading) {
    return (
      <section className="dish-card loading-card" aria-live="polite">
        <div className="dish-loader">
          <span />
          <span />
          <span />
        </div>
        <h3>第{index}道菜烹调中</h3>
        <p>炉火正在把主厨的灵感熬成形状</p>
      </section>
    );
  }

  if (!dish) {
    const CardTag = onEmptyClick ? 'button' : 'section';

    return (
      <CardTag
        className={`dish-card empty-card ${onEmptyClick ? 'actionable-card' : ''}`}
        type={onEmptyClick ? 'button' : undefined}
        onClick={onEmptyClick}
      >
        <div className="empty-plate" />
        <h3>还差第{index}道菜</h3>
        <p>{onEmptyClick ? '点击继续创作第二道菜' : '完成创作后会在这里出现'}</p>
      </CardTag>
    );
  }

  return (
    <section className={`dish-card ${dish.motion === 'spark' ? 'spark-dish' : 'float-dish'}`}>
      {dish.imageUrl ? (
        <img className="generated-dish-image pixelated" src={dish.imageUrl} alt={dish.name} draggable="false" />
      ) : (
        <div
          className="pixel-dish"
          style={{
            '--dish-color': dish.color,
            '--dish-accent': dish.accent,
          }}
        >
          <span />
          <span />
          <span />
        </div>
      )}
      <div>
        <p className="eyebrow">Dish {index}</p>
        <h3>{dish.name}</h3>
        <p>{dish.ingredient}</p>
      </div>
      {onRedo ? (
        <PixelButton
          type="button"
          variant="ghost"
          icon={RefreshCw}
          className="w-full text-sm shadow-none"
          onClick={() => onRedo(index)}
        >
          重做这道
        </PixelButton>
      ) : null}
    </section>
  );
}
