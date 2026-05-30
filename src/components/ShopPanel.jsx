import "../styles.css";
import powerTowerIcon from "../assets/shop/power-tower.png";
import relayCoilIcon from "../assets/shop/relay-coil.png";
import smallGeneratorIcon from "../assets/shop/small-generator.png";

const ITEM_ICONS = {
  "small-generator": smallGeneratorIcon,
  "relay-coil": relayCoilIcon,
  "power-tower": powerTowerIcon,
};

export default function ShopPanel({ items = [], onBuy }) {
  const compactItems = items.slice(0, 3);

  return (
    <aside className="shop-panel" aria-label="ショップ">
      <div className="shop-panel__title">
        <span>SHOP</span>
        <strong>RPMで強化</strong>
      </div>

      <div className="shop-items">
        {compactItems.map((item) => (
          <button
            className="shop-item"
            key={item.id}
            type="button"
            onClick={() => onBuy(item.id)}
            disabled={!item.canBuy}
          >
            <span className="shop-item__icon" aria-hidden="true">
              <img src={ITEM_ICONS[item.id]} alt="" />
            </span>
            <span className="shop-item__main">
              <strong>{item.name}</strong>
              <span>{item.description}</span>
            </span>
            <span className="shop-item__meta">
              <span>{item.cost} RPM</span>
              <span>+{item.rpmBoost}</span>
              <span>所持 {item.owned}</span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
