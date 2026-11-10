import {
  AdvancedDynamicTexture,
  TextBlock,
  StackPanel,
  Button,
  Rectangle,
  Control,
  ScrollViewer
} from '@babylonjs/gui';
import { SaveManager } from '../core/SaveManager';
import { SoundManager } from '../core/SoundManager';

export class ShopModal {
  private panel: Rectangle;
  private bankText: TextBlock;
  private contentStack: StackPanel;
  private currentTab: 'UPGRADES' | 'SKINS' | 'BIKES' = 'UPGRADES';

  public onClose: () => void = () => {};
  public onSkinChanged: (skinId: string) => void = () => {};
  public onBikeChanged: (bikeId: string) => void = () => {};

  constructor(
    private ui: AdvancedDynamicTexture,
    private saveManager: SaveManager,
    private sound: SoundManager
  ) {
    // 1. Modal Overlay Panel
    this.panel = new Rectangle('shopPanel');
    this.panel.width = '520px';
    this.panel.height = '620px';
    this.panel.cornerRadius = 24;
    this.panel.color = '#ffaa00';
    this.panel.thickness = 3;
    this.panel.background = 'rgba(10, 15, 28, 0.96)';
    this.panel.isVisible = false;
    this.panel.zIndex = 100;
    this.ui.addControl(this.panel);

    const mainStack = new StackPanel();
    this.panel.addControl(mainStack);

    // 2. Header Bar
    const headerStack = new StackPanel();
    headerStack.isVertical = false;
    headerStack.height = '50px';
    headerStack.paddingTop = '10px';
    mainStack.addControl(headerStack);

    const title = new TextBlock();
    title.text = 'GARAGE & SHOP';
    title.color = '#ffd166';
    title.fontSize = 24;
    title.fontFamily = 'Bungee, sans-serif';
    title.width = '240px';
    headerStack.addControl(title);

    // Bank display
    this.bankText = new TextBlock();
    this.bankText.text = `KSh ${this.saveManager.totalCoins}`;
    this.bankText.color = '#06d6a0';
    this.bankText.fontSize = 18;
    this.bankText.fontFamily = 'Bungee, sans-serif';
    this.bankText.width = '180px';
    headerStack.addControl(this.bankText);

    // Close Button (✕)
    const closeBtn = Button.CreateSimpleButton('shopClose', '✕');
    closeBtn.width = '42px';
    closeBtn.height = '42px';
    closeBtn.color = '#ffffff';
    closeBtn.background = '#e63946';
    closeBtn.cornerRadius = 21;
    closeBtn.fontSize = 20;
    closeBtn.fontFamily = 'Inter, sans-serif';
    closeBtn.onPointerUpObservable.add(() => {
      this.hide();
      this.onClose();
    });
    headerStack.addControl(closeBtn);

    // 3. Tab Buttons (UPGRADES vs SKINS vs BIKES)
    const tabStack = new StackPanel();
    tabStack.isVertical = false;
    tabStack.height = '50px';
    tabStack.paddingTop = '8px';
    mainStack.addControl(tabStack);

    const tabUpgrades = Button.CreateSimpleButton('tabUpg', '⚡ UPGRADES');
    tabUpgrades.width = '150px';
    tabUpgrades.height = '38px';
    tabUpgrades.color = '#ffffff';
    tabUpgrades.background = '#2a3b5c';
    tabUpgrades.cornerRadius = 10;
    tabUpgrades.fontFamily = 'Bungee, sans-serif';
    tabUpgrades.fontSize = 12;
    tabUpgrades.onPointerUpObservable.add(() => {
      this.currentTab = 'UPGRADES';
      this.renderContent();
    });
    tabStack.addControl(tabUpgrades);

    const tabSkins = Button.CreateSimpleButton('tabSkins', '👕 OUTFITS');
    tabSkins.width = '150px';
    tabSkins.height = '38px';
    tabSkins.color = '#ffffff';
    tabSkins.background = '#1a2234';
    tabSkins.cornerRadius = 10;
    tabSkins.fontFamily = 'Bungee, sans-serif';
    tabSkins.fontSize = 12;
    tabSkins.onPointerUpObservable.add(() => {
      this.currentTab = 'SKINS';
      this.renderContent();
    });
    tabStack.addControl(tabSkins);

    const tabBikes = Button.CreateSimpleButton('tabBikes', '🏍️ BIKES');
    tabBikes.width = '150px';
    tabBikes.height = '38px';
    tabBikes.color = '#ffffff';
    tabBikes.background = '#1a2234';
    tabBikes.cornerRadius = 10;
    tabBikes.fontFamily = 'Bungee, sans-serif';
    tabBikes.fontSize = 12;
    tabBikes.onPointerUpObservable.add(() => {
      this.currentTab = 'BIKES';
      this.renderContent();
    });
    tabStack.addControl(tabBikes);

    // 4. Scrollable Content Area
    const scroll = new ScrollViewer();
    scroll.width = '480px';
    scroll.height = '460px';
    scroll.paddingTop = '10px';
    mainStack.addControl(scroll);

    this.contentStack = new StackPanel();
    scroll.addControl(this.contentStack);

    this.renderContent();
  }

  public show() {
    this.bankText.text = `KSh ${this.saveManager.totalCoins}`;
    this.renderContent();
    this.panel.isVisible = true;
  }

  public hide() {
    this.panel.isVisible = false;
  }

  public get isVisible(): boolean {
    return this.panel.isVisible;
  }

  private renderContent() {
    this.contentStack.clearControls();
    this.bankText.text = `KSh ${this.saveManager.totalCoins}`;

    if (this.currentTab === 'UPGRADES') {
      this.renderUpgradeCard('nitro', '🚀 SHENG NITRO', 'Boost speed & invincibility');
      this.renderUpgradeCard('magnet', '🧲 COIN MAGNET', 'Pulls all 3 lanes of coins');
      this.renderUpgradeCard('multiplier', '🪙 MULTIPLIER', 'Boosts your distance score rate');
    } else if (this.currentTab === 'SKINS') {
      this.renderSkinsList();
    } else {
      this.renderBikesList();
    }
  }

  private renderUpgradeCard(type: 'nitro' | 'magnet' | 'multiplier', name: string, sub: string) {
    const info = this.saveManager.getUpgradeInfo(type);

    const card = new Rectangle(`card_${type}`);
    card.width = '450px';
    card.height = '125px';
    card.cornerRadius = 14;
    card.color = '#384666';
    card.thickness = 1.5;
    card.background = 'rgba(18, 25, 45, 0.9)';
    card.paddingBottom = '12px';
    this.contentStack.addControl(card);

    const stack = new StackPanel();
    card.addControl(stack);

    // Name + Level indicator
    const topRow = new StackPanel();
    topRow.isVertical = false;
    topRow.height = '32px';
    stack.addControl(topRow);

    const titleText = new TextBlock();
    titleText.text = name;
    titleText.color = '#ffffff';
    titleText.fontSize = 16;
    titleText.fontFamily = 'Bungee, sans-serif';
    titleText.width = '240px';
    topRow.addControl(titleText);

    // Progress pips: e.g. [■■■□□]
    let pips = '';
    for (let i = 1; i <= info.maxLevel; i++) {
      pips += i <= info.level ? '■ ' : '□ ';
    }
    const levelText = new TextBlock();
    levelText.text = `Lv ${info.level}/${info.maxLevel} ${pips}`;
    levelText.color = '#ffd166';
    levelText.fontSize = 14;
    levelText.fontFamily = 'Inter, sans-serif';
    levelText.width = '190px';
    topRow.addControl(levelText);

    // Description text
    const descText = new TextBlock();
    descText.text = `${sub}\nCurrent: ${info.desc}`;
    descText.color = '#a0aec0';
    descText.fontSize = 13;
    descText.fontFamily = 'Inter, sans-serif';
    descText.height = '36px';
    stack.addControl(descText);

    // Buy / Upgrade Button
    const btn = Button.CreateSimpleButton(`btnUpg_${type}`, info.level >= info.maxLevel ? 'MAX LEVEL' : `UPGRADE (KSh ${info.cost})`);
    btn.width = '220px';
    btn.height = '34px';
    btn.cornerRadius = 17;
    btn.fontFamily = 'Bungee, sans-serif';
    btn.fontSize = 13;

    const canAfford = this.saveManager.totalCoins >= info.cost && info.level < info.maxLevel;
    if (info.level >= info.maxLevel) {
      btn.background = '#4a5568';
      btn.color = '#a0aec0';
    } else if (canAfford) {
      btn.background = '#06d6a0';
      btn.color = '#ffffff';
      btn.onPointerUpObservable.add(() => {
        if (this.saveManager.buyUpgrade(type)) {
          this.sound.playCoin();
          this.renderContent();
        }
      });
    } else {
      btn.background = '#718096';
      btn.color = '#e2e8f0';
    }
    stack.addControl(btn);
  }

  private renderSkinsList() {
    for (const skin of SaveManager.SKINS) {
      const isUnlocked = this.saveManager.isSkinUnlocked(skin.id);
      const isEquipped = this.saveManager.activeSkin === skin.id;

      const card = new Rectangle(`skinCard_${skin.id}`);
      card.width = '450px';
      card.height = '115px';
      card.cornerRadius = 14;
      card.color = isEquipped ? '#06d6a0' : '#384666';
      card.thickness = isEquipped ? 2.5 : 1.5;
      card.background = isEquipped ? 'rgba(6, 45, 35, 0.9)' : 'rgba(18, 25, 45, 0.9)';
      card.paddingBottom = '12px';
      this.contentStack.addControl(card);

      const stack = new StackPanel();
      card.addControl(stack);

      // Skin Name
      const title = new TextBlock();
      title.text = skin.name;
      title.color = isEquipped ? '#06d6a0' : '#ffffff';
      title.fontSize = 16;
      title.fontFamily = 'Bungee, sans-serif';
      title.height = '28px';
      stack.addControl(title);

      // Description
      const desc = new TextBlock();
      desc.text = skin.desc;
      desc.color = '#a0aec0';
      desc.fontSize = 13;
      desc.fontFamily = 'Inter, sans-serif';
      desc.height = '24px';
      stack.addControl(desc);

      // Action Button
      let btnText = '';
      let btnBg = '';

      if (isEquipped) {
        btnText = '✓ EQUIPPED';
        btnBg = '#06d6a0';
      } else if (isUnlocked) {
        btnText = 'EQUIP OUTFIT';
        btnBg = '#3b82f6';
      } else {
        btnText = `UNLOCK (KSh ${skin.cost})`;
        const canAfford = this.saveManager.totalCoins >= skin.cost;
        btnBg = canAfford ? '#f59e0b' : '#718096';
      }

      const btn = Button.CreateSimpleButton(`btnSkin_${skin.id}`, btnText);
      btn.width = '200px';
      btn.height = '34px';
      btn.cornerRadius = 17;
      btn.background = btnBg;
      btn.color = '#ffffff';
      btn.fontFamily = 'Bungee, sans-serif';
      btn.fontSize = 13;

      btn.onPointerUpObservable.add(() => {
        if (isEquipped) return;

        if (isUnlocked) {
          this.saveManager.equipSkin(skin.id);
          this.onSkinChanged(skin.id);
          this.sound.playLaneSwitch();
          this.renderContent();
        } else {
          if (this.saveManager.buySkin(skin.id)) {
            this.sound.playCoin();
            this.onSkinChanged(skin.id);
            this.renderContent();
          }
        }
      });

      stack.addControl(btn);
    }
  }

  private renderBikesList() {
    // 1. Refill Boda Rides Pack
    const packCard = new Rectangle('packCard');
    packCard.width = '450px';
    packCard.height = '115px';
    packCard.cornerRadius = 14;
    packCard.color = '#f59e0b';
    packCard.thickness = 2;
    packCard.background = 'rgba(40, 30, 10, 0.9)';
    packCard.paddingBottom = '12px';
    this.contentStack.addControl(packCard);

    const packStack = new StackPanel();
    packCard.addControl(packStack);

    const pTitle = new TextBlock();
    pTitle.text = `🎟️ BUY 3x BODA RIDES (KSh 800)`;
    pTitle.color = '#ffd166';
    pTitle.fontSize = 16;
    pTitle.fontFamily = 'Bungee, sans-serif';
    pTitle.height = '28px';
    packStack.addControl(pTitle);

    const pDesc = new TextBlock();
    pDesc.text = `Current Stock: ${this.saveManager.bodaInventory} rides • Crash Shield Protection`;
    pDesc.color = '#a0aec0';
    pDesc.fontSize = 13;
    pDesc.fontFamily = 'Inter, sans-serif';
    pDesc.height = '24px';
    packStack.addControl(pDesc);

    const packBtn = Button.CreateSimpleButton('btnPack', 'BUY 3x BODA (KSh 800)');
    packBtn.width = '200px';
    packBtn.height = '34px';
    packBtn.cornerRadius = 17;
    const canAffordPack = this.saveManager.totalCoins >= 800;
    packBtn.background = canAffordPack ? '#06d6a0' : '#718096';
    packBtn.color = '#ffffff';
    packBtn.fontFamily = 'Bungee, sans-serif';
    packBtn.fontSize = 12;
    packBtn.onPointerUpObservable.add(() => {
      if (this.saveManager.buyBodaPack()) {
        this.sound.playCoin();
        this.renderContent();
      }
    });
    packStack.addControl(packBtn);

    // 2. Custom Bike Styles
    for (const bike of SaveManager.BIKES) {
      const isUnlocked = this.saveManager.isBikeUnlocked(bike.id);
      const isEquipped = this.saveManager.activeBike === bike.id;

      const card = new Rectangle(`bikeCard_${bike.id}`);
      card.width = '450px';
      card.height = '115px';
      card.cornerRadius = 14;
      card.color = isEquipped ? '#06d6a0' : '#384666';
      card.thickness = isEquipped ? 2.5 : 1.5;
      card.background = isEquipped ? 'rgba(6, 45, 35, 0.9)' : 'rgba(18, 25, 45, 0.9)';
      card.paddingBottom = '12px';
      this.contentStack.addControl(card);

      const stack = new StackPanel();
      card.addControl(stack);

      const title = new TextBlock();
      title.text = bike.name;
      title.color = isEquipped ? '#06d6a0' : '#ffffff';
      title.fontSize = 16;
      title.fontFamily = 'Bungee, sans-serif';
      title.height = '28px';
      stack.addControl(title);

      const desc = new TextBlock();
      desc.text = bike.desc;
      desc.color = '#a0aec0';
      desc.fontSize = 13;
      desc.fontFamily = 'Inter, sans-serif';
      desc.height = '24px';
      stack.addControl(desc);

      let btnText = '';
      let btnBg = '';

      if (isEquipped) {
        btnText = '✓ EQUIPPED';
        btnBg = '#06d6a0';
      } else if (isUnlocked) {
        btnText = 'EQUIP BIKE';
        btnBg = '#3b82f6';
      } else {
        btnText = `UNLOCK (KSh ${bike.cost})`;
        const canAfford = this.saveManager.totalCoins >= bike.cost;
        btnBg = canAfford ? '#f59e0b' : '#718096';
      }

      const btn = Button.CreateSimpleButton(`btnBike_${bike.id}`, btnText);
      btn.width = '200px';
      btn.height = '34px';
      btn.cornerRadius = 17;
      btn.background = btnBg;
      btn.color = '#ffffff';
      btn.fontFamily = 'Bungee, sans-serif';
      btn.fontSize = 13;

      btn.onPointerUpObservable.add(() => {
        if (isEquipped) return;

        if (isUnlocked) {
          this.saveManager.equipBike(bike.id);
          this.onBikeChanged(bike.id);
          this.sound.playLaneSwitch();
          this.renderContent();
        } else {
          if (this.saveManager.buyBike(bike.id)) {
            this.sound.playCoin();
            this.onBikeChanged(bike.id);
            this.renderContent();
          }
        }
      });

      stack.addControl(btn);
    }
  }
}
