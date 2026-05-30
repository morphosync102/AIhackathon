import assert from "node:assert/strict";
import test from "node:test";

import {
  INITIAL_GAME_STATE,
  applyAutoRpmTick,
  applyWordAnalysis,
  buyShopItem,
  getRpmPerSecond,
  getShopItems,
} from "./gameLogic.js";

test("word analysis adds growth energy and spendable RPM", () => {
  const state = applyWordAnalysis(INITIAL_GAME_STATE, "改善する", {
    summary: "改善する",
    energy: 20,
    type: "行動",
    reason: "行動の言葉",
    comment: "風が届いた",
  });

  assert.equal(state.totalEnergy, 20);
  assert.equal(state.currentRpm, 40);
});

test("shop item spends RPM and increases RPM production", () => {
  const chargedState = {
    ...INITIAL_GAME_STATE,
    currentRpm: 45,
  };

  const purchased = buyShopItem(chargedState, "small-generator");
  const items = getShopItems(purchased);

  assert.equal(purchased.currentRpm, 5);
  assert.equal(purchased.shopItems["small-generator"], 1);
  assert.equal(items[0].cost, 54);
  assert.equal(getRpmPerSecond(purchased), 12);
});

test("auto RPM tick adds owned item production every second", () => {
  const state = {
    ...INITIAL_GAME_STATE,
    currentRpm: 10,
    shopItems: {
      "small-generator": 2,
      "relay-coil": 1,
    },
  };

  const ticked = applyAutoRpmTick(state);

  assert.equal(ticked.currentRpm, 70);
});
