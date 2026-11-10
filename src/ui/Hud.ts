import {
  AdvancedDynamicTexture,
  TextBlock,
  StackPanel,
  Button,
  Rectangle,
  Control
} from '@babylonjs/gui';

export class Hud {
  private ui: AdvancedDynamicTexture;
  private distanceText: TextBlock;
  private coinText: TextBlock;
  private speedBadgeText: TextBlock;
  private powerupText: TextBlock;
  private bodaStatusText: TextBlock;
  private pursuitAlertText: TextBlock;

  private startPanel: Rectangle;
  private gameOverPanel: Rectangle;
  private gameOverTitleText: TextBlock;
  private gameOverStatsText: TextBlock;

  public onStartClick: () => void = () => {};
  public onRestartClick: () => void = () => {};
  public onShopClick: () => void = () => {};

  constructor() {
    this.ui = AdvancedDynamicTexture.CreateFullscreenUI('HUD');

    // 1. Top HUD Bar (Score & Coins)
    const topBar = new StackPanel();
    topBar.isVertical = false;
    topBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    topBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    topBar.top = '20px';
    topBar.height = '60px';
    this.ui.addControl(topBar);

    // Distance Card
    const distCard = new Rectangle();
    distCard.width = '170px';
    distCard.height = '48px';
    distCard.cornerRadius = 12;
    distCard.color = '#ff9f1c';
    distCard.thickness = 2;
    distCard.background = 'rgba(15, 23, 42, 0.85)';
    distCard.paddingRight = '10px';
    topBar.addControl(distCard);

    this.distanceText = new TextBlock();
    this.distanceText.text = '0 m';
    this.distanceText.color = '#ffffff';
    this.distanceText.fontSize = 20;
    this.distanceText.fontFamily = 'Bungee, sans-serif';
    distCard.addControl(this.distanceText);

    // Coin Card
    const coinCard = new Rectangle();
    coinCard.width = '170px';
    coinCard.height = '48px';
    coinCard.cornerRadius = 12;
    coinCard.color = '#ffd166';
    coinCard.thickness = 2;
    coinCard.background = 'rgba(15, 23, 42, 0.85)';
    coinCard.paddingLeft = '10px';
    topBar.addControl(coinCard);

    this.coinText = new TextBlock();
    this.coinText.text = 'KSh 0';
    this.coinText.color = '#ffd166';
    this.coinText.fontSize = 20;
    this.coinText.fontFamily = 'Bungee, sans-serif';
    coinCard.addControl(this.coinText);

    // Speed / Multiplier Card
    this.speedBadgeText = new TextBlock();
    this.speedBadgeText.text = 'SPEED: 1.0x';
    this.speedBadgeText.color = '#06d6a0';
    this.speedBadgeText.fontSize = 16;
    this.speedBadgeText.fontFamily = 'Inter, sans-serif';
    this.speedBadgeText.top = '80px';
    this.speedBadgeText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.ui.addControl(this.speedBadgeText);

    // Powerup Active Alert
    this.powerupText = new TextBlock();
    this.powerupText.text = '';
    this.powerupText.color = '#ff007f';
    this.powerupText.fontSize = 22;
    this.powerupText.fontFamily = 'Bungee, sans-serif';
    this.powerupText.top = '110px';
    this.powerupText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.ui.addControl(this.powerupText);

    // Boda-Boda Ride & Shield Status
    this.bodaStatusText = new TextBlock();
    this.bodaStatusText.text = '';
    this.bodaStatusText.color = '#f59e0b';
    this.bodaStatusText.fontSize = 18;
    this.bodaStatusText.fontFamily = 'Bungee, sans-serif';
    this.bodaStatusText.top = '140px';
    this.bodaStatusText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.ui.addControl(this.bodaStatusText);

    // Kanjo Pursuit Alert
    const pursuitAlert = new TextBlock('pursuitAlert');
    pursuitAlert.text = '';
    pursuitAlert.color = '#ff3344';
    pursuitAlert.fontSize = 18;
    pursuitAlert.fontFamily = 'Bungee, sans-serif';
    pursuitAlert.top = '170px';
    pursuitAlert.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.ui.addControl(pursuitAlert);
    this.pursuitAlertText = pursuitAlert;

    // 2. Start Screen Overlay
    this.startPanel = new Rectangle('startPanel');
    this.startPanel.width = '480px';
    this.startPanel.height = '420px';
    this.startPanel.cornerRadius = 24;
    this.startPanel.color = '#ff0055';
    this.startPanel.thickness = 3;
    this.startPanel.background = 'rgba(11, 19, 43, 0.94)';
    this.ui.addControl(this.startPanel);

    const startStack = new StackPanel();
    this.startPanel.addControl(startStack);

    const titleText = new TextBlock();
    titleText.text = 'NGANYA SURFERS';
    titleText.color = '#ffd166';
    titleText.fontSize = 34;
    titleText.fontFamily = 'Bungee, sans-serif';
    titleText.height = '50px';
    startStack.addControl(titleText);

    const subtitle = new TextBlock();
    subtitle.text = 'NAIROBI TRAFFIC DODGER';
    subtitle.color = '#06d6a0';
    subtitle.fontSize = 18;
    subtitle.fontFamily = 'Bungee, sans-serif';
    subtitle.height = '35px';
    startStack.addControl(subtitle);

    const instructions = new TextBlock();
    instructions.text = 'Dodging incoming high-speed Nganyas!\n\n⬅️ ➡️ or A / D : Switch Lanes\n⬆️ or W / Space : Jump Over Barriers\n⬇️ or S : Slide Under Signboards\n📱 Mobile : Swipe in any direction';
    instructions.color = '#e2e8f0';
    instructions.fontSize = 15;
    instructions.fontFamily = 'Inter, sans-serif';
    instructions.height = '160px';
    startStack.addControl(instructions);

    const playBtn = Button.CreateSimpleButton('playBtn', 'ANZA RUN (PLAY)');
    playBtn.width = '240px';
    playBtn.height = '50px';
    playBtn.color = '#ffffff';
    playBtn.cornerRadius = 25;
    playBtn.background = '#e63946';
    playBtn.fontFamily = 'Bungee, sans-serif';
    playBtn.fontSize = 17;
    playBtn.onPointerUpObservable.add(() => {
      this.hideStartScreen();
      this.onStartClick();
    });
    startStack.addControl(playBtn);

    const startShopBtn = Button.CreateSimpleButton('startShopBtn', '🛒 GARAGE & SHOP');
    startShopBtn.width = '240px';
    startShopBtn.height = '42px';
    startShopBtn.color = '#ffffff';
    startShopBtn.cornerRadius = 21;
    startShopBtn.background = '#f59e0b';
    startShopBtn.fontFamily = 'Bungee, sans-serif';
    startShopBtn.fontSize = 15;
    startShopBtn.paddingTop = '8px';
    startShopBtn.onPointerUpObservable.add(() => {
      this.onShopClick();
    });
    startStack.addControl(startShopBtn);

    // 3. Game Over Screen Overlay
    this.gameOverPanel = new Rectangle('gameOverPanel');
    this.gameOverPanel.width = '460px';
    this.gameOverPanel.height = '380px';
    this.gameOverPanel.cornerRadius = 24;
    this.gameOverPanel.color = '#e63946';
    this.gameOverPanel.thickness = 3;
    this.gameOverPanel.background = 'rgba(15, 23, 42, 0.95)';
    this.gameOverPanel.isVisible = false;
    this.ui.addControl(this.gameOverPanel);

    const overStack = new StackPanel();
    this.gameOverPanel.addControl(overStack);

    const overTitle = new TextBlock();
    overTitle.text = 'WUUEH! UME-KNOCKIWA!';
    overTitle.color = '#e63946';
    overTitle.fontSize = 28;
    overTitle.fontFamily = 'Bungee, sans-serif';
    overTitle.height = '55px';
    overStack.addControl(overTitle);
    this.gameOverTitleText = overTitle;

    this.gameOverStatsText = new TextBlock();
    this.gameOverStatsText.text = 'Distance: 0m\nCoins: KSh 0\nHighscore: 0m';
    this.gameOverStatsText.color = '#ffffff';
    this.gameOverStatsText.fontSize = 18;
    this.gameOverStatsText.fontFamily = 'Inter, sans-serif';
    this.gameOverStatsText.height = '140px';
    overStack.addControl(this.gameOverStatsText);

    // Button row in game over
    const btnRow = new StackPanel();
    btnRow.isVertical = false;
    btnRow.height = '55px';
    overStack.addControl(btnRow);

    const retryBtn = Button.CreateSimpleButton('retryBtn', 'PIGA RAUNDI');
    retryBtn.width = '200px';
    retryBtn.height = '48px';
    retryBtn.color = '#ffffff';
    retryBtn.cornerRadius = 24;
    retryBtn.background = '#06d6a0';
    retryBtn.fontFamily = 'Bungee, sans-serif';
    retryBtn.fontSize = 16;
    retryBtn.paddingRight = '6px';
    retryBtn.onPointerUpObservable.add(() => {
      this.hideGameOverScreen();
      this.onRestartClick();
    });
    btnRow.addControl(retryBtn);

    const overShopBtn = Button.CreateSimpleButton('overShopBtn', '🛒 SHOP');
    overShopBtn.width = '180px';
    overShopBtn.height = '48px';
    overShopBtn.color = '#ffffff';
    overShopBtn.cornerRadius = 24;
    overShopBtn.background = '#f59e0b';
    overShopBtn.fontFamily = 'Bungee, sans-serif';
    overShopBtn.fontSize = 16;
    overShopBtn.paddingLeft = '6px';
    overShopBtn.onPointerUpObservable.add(() => {
      this.onShopClick();
    });
    btnRow.addControl(overShopBtn);
  }

  public getUI(): AdvancedDynamicTexture {
    return this.ui;
  }

  public updateStats(
    distance: number,
    coins: number,
    speedMultiplier: number,
    powerupName: string,
    isClosePursuit: boolean = false,
    isRidingBoda: boolean = false,
    bodaTimer: number = 0,
    bodaInventory: number = 0
  ) {
    this.distanceText.text = `${Math.floor(distance)} m`;
    this.coinText.text = `KSh ${coins * 50}`;
    this.speedBadgeText.text = `SPEED: ${speedMultiplier.toFixed(1)}x`;
    this.powerupText.text = powerupName;

    if (isRidingBoda) {
      this.bodaStatusText.text = `🏍️ BODA SHIELD: ${Math.ceil(bodaTimer)}s`;
      this.bodaStatusText.color = '#06d6a0';
    } else if (bodaInventory > 0) {
      this.bodaStatusText.text = `🏍️ BODA: x${bodaInventory} (Double-Tap / Press E)`;
      this.bodaStatusText.color = '#ffd166';
    } else {
      this.bodaStatusText.text = '';
    }

    if (isClosePursuit) {
      this.pursuitAlertText.text = '🚨 KANJO ON YOUR HEELS! DODGE!';
    } else {
      this.pursuitAlertText.text = '';
    }
  }

  public hideStartScreen() {
    this.startPanel.isVisible = false;
  }

  public showGameOver(distance: number, coins: number, highScore: number, reason: 'KNOCKED' | 'ARRESTED' = 'KNOCKED') {
    if (reason === 'ARRESTED') {
      this.gameOverTitleText.text = 'AMEKUSHIKA! (ARRESTED!)';
      this.gameOverTitleText.color = '#ffd166';
      this.gameOverStatsText.text = `👮 Caught by Kanjo Askari!\n\n🏁 Distance: ${Math.floor(distance)} m\n💰 Coins: KSh ${coins * 50}\n🏆 Best Distance: ${Math.floor(highScore)} m`;
    } else {
      this.gameOverTitleText.text = 'WUUEH! UME-KNOCKIWA!';
      this.gameOverTitleText.color = '#e63946';
      this.gameOverStatsText.text = `🏁 Distance: ${Math.floor(distance)} m\n💰 Coins: KSh ${coins * 50}\n🏆 Best Distance: ${Math.floor(highScore)} m`;
    }
    this.gameOverPanel.isVisible = true;
  }

  public hideGameOverScreen() {
    this.gameOverPanel.isVisible = false;
  }
}
