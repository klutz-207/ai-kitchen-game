import React from 'react';

export function ChefStand({ chef, action = 'idle' }) {
  if (chef?.actions?.[action]) {
    return (
      <div className={`actor-card chef-card art-chef-card chef-${chef.id} action-${action}`} aria-label={chef.name}>
        <img className="chef-portrait" src={chef.actions[action]} alt="" draggable="false" />
        <span className="actor-ground-shadow" />
        <p>{chef.name}</p>
      </div>
    );
  }

  return (
    <div className="actor-card chef-card" aria-label="临时厨师占位形象">
      <div className="chef-hat">
        <span />
        <span />
        <span />
      </div>
      <div className="chef-face">
        <i />
        <i />
      </div>
      <div className="chef-body">
        <span className="chef-apron-tie" />
      </div>
      <span className="actor-ground-shadow" />
      <p>主厨</p>
    </div>
  );
}

export function GuestStand({ guest, mood = 'waiting' }) {
  if (guest.art?.src) {
    return (
      <div className={`actor-card guest-card art-guest-card ${mood}`} style={{ '--guest-color': guest.color }}>
        <img className="guest-portrait" src={guest.art.src} alt={guest.art.alt || guest.name} draggable="false" />
        <span className="actor-ground-shadow" />
        <p>{guest.name}</p>
      </div>
    );
  }

  return (
    <div className={`actor-card guest-card ${mood}`} style={{ '--guest-color': guest.color }}>
      <div className="guest-head">
        <span>{guest.avatar}</span>
        <i className="guest-hairline" />
      </div>
      <div className="guest-body">
        <i />
        <span className="guest-pocket" />
      </div>
      <span className="actor-ground-shadow" />
      <p>{guest.name}</p>
    </div>
  );
}
