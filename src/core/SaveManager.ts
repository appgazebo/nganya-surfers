export interface UpgradeInfo {
  level: number;
  maxLevel: number;
  cost: number;
  value: number; // Duration or multiplier value
  desc: string;
}

export interface SkinInfo {
  id: string;
  name: string;
  cost: number;
  unlocked: boolean;
  desc: string;
}

export interface SaveData {
  totalCoins: number; // Banked KSh
  highScore: number;
  bodaInventory: number; // Number of Boda-Boda rides available
  showTouchButtons?: boolean; // Optional on-screen touch buttons (default false)
  upgrades: {
    nitro: number;     // 1 to 5
    magnet: number;    // 1 to 5
    multiplier: number;// 1 to 5
  };
  unlockedSkins: string[];
  activeSkin: string;
  unlockedBikes: string[];
  activeBike: string;
}

const STORAGE_KEY = 'nganya_surfers_save_v1';

export class SaveManager {
  private data: SaveData;

  // Upgrade config: cost and value per tier
  public static UPGRADE_CONFIG = {
    nitro: [
      { cost: 0, val: 5.5, desc: '5.5s Duration' },
      { cost: 1000, val: 7.0, desc: '7.0s Duration' },
      { cost: 2500, val: 8.5, desc: '8.5s Duration' },
      { cost: 5000, val: 10.0, desc: '10.0s Duration' },
      { cost: 10000, val: 12.0, desc: '12.0s Max Nitro!' }
    ],
    magnet: [
      { cost: 0, val: 8.0, desc: '8.0s (18m Reach)' },
      { cost: 1000, val: 10.0, desc: '10.0s (22m Reach)' },
      { cost: 2500, val: 12.0, desc: '12.0s (26m Reach)' },
      { cost: 5000, val: 14.0, desc: '14.0s (30m Reach)' },
      { cost: 10000, val: 16.0, desc: '16.0s (35m Super Reach!)' }
    ],
    multiplier: [
      { cost: 0, val: 1.0, desc: '1.0x Base Multiplier' },
      { cost: 1500, val: 1.5, desc: '1.5x Multiplier' },
      { cost: 3500, val: 2.0, desc: '2.0x Double Multiplier' },
      { cost: 7500, val: 2.5, desc: '2.5x Multiplier' },
      { cost: 15000, val: 3.0, desc: '3.0x Triple Multiplier!' }
    ]
  };

  public static SKINS = [
    {
      id: 'DEFAULT',
      name: 'STREET RUNNER',
      cost: 0,
      desc: 'Nairobi red hoodie & denim'
    },
    {
      id: 'MAKANGA',
      name: 'MAKANGA VIP',
      cost: 3500,
      desc: 'Corduroy conductor jacket & khaki'
    },
    {
      id: 'CYBERPUNK',
      name: 'CYBER MATWANA',
      cost: 8000,
      desc: 'Neon cyan cyber jacket & hot pink glow'
    }
  ];

  public static BIKES = [
    {
      id: 'STANDARD',
      name: 'BOXER 150 CLASSIC',
      cost: 0,
      desc: 'Iconic red Nairobi street boda'
    },
    {
      id: 'DELIVERY',
      name: 'SAFARI DELIVERY RACER',
      cost: 4000,
      desc: 'Yellow delivery box & tuned engine'
    },
    {
      id: 'CYBER',
      name: 'CYBER BODA ELECTRIC',
      cost: 9000,
      desc: 'Neon cyan battery pack & glowing rims'
    }
  ];

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          totalCoins: parsed.totalCoins ?? 0,
          highScore: parsed.highScore ?? 0,
          bodaInventory: (parsed.bodaInventory !== undefined && parsed.bodaInventory > 0) ? parsed.bodaInventory : 5,
          showTouchButtons: parsed.showTouchButtons ?? false, // Default: OFF for clean swipe
          upgrades: {
            nitro: parsed.upgrades?.nitro ?? 1,
            magnet: parsed.upgrades?.magnet ?? 1,
            multiplier: parsed.upgrades?.multiplier ?? 1
          },
          unlockedSkins: parsed.unlockedSkins ?? ['DEFAULT'],
          activeSkin: parsed.activeSkin ?? 'DEFAULT',
          unlockedBikes: parsed.unlockedBikes ?? ['STANDARD'],
          activeBike: parsed.activeBike ?? 'STANDARD'
        };
      }
    } catch (e) {
      // Fallback
    }

    return {
      totalCoins: 0,
      highScore: 0,
      bodaInventory: 3, // Start with 3 free Boda rides!
      showTouchButtons: false,
      upgrades: { nitro: 1, magnet: 1, multiplier: 1 },
      unlockedSkins: ['DEFAULT'],
      activeSkin: 'DEFAULT',
      unlockedBikes: ['STANDARD'],
      activeBike: 'STANDARD'
    };
  }

  public save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      // Ignore quota errors
    }
  }

  public get totalCoins(): number {
    return this.data.totalCoins;
  }

  public get highScore(): number {
    return this.data.highScore;
  }

  public get activeSkin(): string {
    return this.data.activeSkin;
  }

  public get activeBike(): string {
    return this.data.activeBike;
  }

  public get showTouchButtons(): boolean {
    return this.data.showTouchButtons ?? false;
  }

  public setTouchButtons(enabled: boolean) {
    this.data.showTouchButtons = enabled;
    this.save();
  }

  public get bodaInventory(): number {
    return this.data.bodaInventory;
  }

  public useBoda(): boolean {
    if (this.data.bodaInventory > 0) {
      this.data.bodaInventory--;
    }
    this.save();
    return true; // Always allow riding!
  }

  public buyBodaPack(): boolean {
    const cost = 800; // 3 Boda rides for KSh 800
    if (this.data.totalCoins >= cost) {
      this.data.totalCoins -= cost;
      this.data.bodaInventory += 3;
      this.save();
      return true;
    }
    return false;
  }

  public isBikeUnlocked(bikeId: string): boolean {
    return this.data.unlockedBikes.includes(bikeId);
  }

  public buyBike(bikeId: string): boolean {
    if (this.isBikeUnlocked(bikeId)) return true;
    const bike = SaveManager.BIKES.find(b => b.id === bikeId);
    if (!bike) return false;
    if (this.data.totalCoins < bike.cost) return false;

    this.data.totalCoins -= bike.cost;
    this.data.unlockedBikes.push(bikeId);
    this.data.activeBike = bikeId;
    this.save();
    return true;
  }

  public equipBike(bikeId: string): boolean {
    if (!this.isBikeUnlocked(bikeId)) return false;
    this.data.activeBike = bikeId;
    this.save();
    return true;
  }

  public setHighScore(score: number) {
    if (score > this.data.highScore) {
      this.data.highScore = score;
      this.save();
    }
  }

  public bankCoins(amount: number) {
    this.data.totalCoins += amount;
    this.save();
  }

  public getUpgradeInfo(type: 'nitro' | 'magnet' | 'multiplier'): UpgradeInfo {
    const level = this.data.upgrades[type];
    const tiers = SaveManager.UPGRADE_CONFIG[type];
    const maxLevel = tiers.length;
    const isMax = level >= maxLevel;
    const nextCost = isMax ? 0 : tiers[level].cost;
    const currentVal = tiers[level - 1].val;
    const desc = isMax ? `${tiers[maxLevel - 1].desc} (MAX)` : tiers[level].desc;

    return {
      level,
      maxLevel,
      cost: nextCost,
      value: currentVal,
      desc
    };
  }

  public buyUpgrade(type: 'nitro' | 'magnet' | 'multiplier'): boolean {
    const info = this.getUpgradeInfo(type);
    if (info.level >= info.maxLevel) return false;
    if (this.data.totalCoins < info.cost) return false;

    this.data.totalCoins -= info.cost;
    this.data.upgrades[type]++;
    this.save();
    return true;
  }

  public isSkinUnlocked(skinId: string): boolean {
    return this.data.unlockedSkins.includes(skinId);
  }

  public buySkin(skinId: string): boolean {
    if (this.isSkinUnlocked(skinId)) return true;
    const skin = SaveManager.SKINS.find(s => s.id === skinId);
    if (!skin) return false;
    if (this.data.totalCoins < skin.cost) return false;

    this.data.totalCoins -= skin.cost;
    this.data.unlockedSkins.push(skinId);
    this.data.activeSkin = skinId;
    this.save();
    return true;
  }

  public equipSkin(skinId: string): boolean {
    if (!this.isSkinUnlocked(skinId)) return false;
    this.data.activeSkin = skinId;
    this.save();
    return true;
  }
}
