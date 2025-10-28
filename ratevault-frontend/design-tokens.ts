import crypto from "crypto";

// 确定性 Seed 计算
const projectName = "RateVault";
const network = "sepolia";
const yearMonth = "202510";
const contractName = "RatingVault.sol";
const seedString = `${projectName}${network}${yearMonth}${contractName}`;
const seed = crypto.createHash("sha256").update(seedString).digest("hex");

// 根据 seed 选择设计维度
const seedNum = parseInt(seed.substring(0, 8), 16);

// 设计体系: 4 = Glassmorphism (0-4)
const designSystemIndex = seedNum % 5;
const designSystems = ["Material", "Fluent", "Neumorphism", "Glassmorphism", "Minimal"];
const designSystem = designSystems[designSystemIndex]; // Glassmorphism

// 色彩方案: E 组 (Purple/Deep Purple/Indigo) - 索引 4 (0-7)
const colorSchemeIndex = (seedNum >> 8) % 8;

const colorSchemes = [
  {
    name: "A",
    primary: "#4F46E5",
    secondary: "#9333EA",
    accent: "#EC4899",
  }, // Indigo/Purple/Pink
  { name: "B", primary: "#3B82F6", secondary: "#06B6D4", accent: "#14B8A6" }, // Blue/Cyan/Teal
  { name: "C", primary: "#10B981", secondary: "#84CC16", accent: "#EAB308" }, // Green/Lime/Yellow
  { name: "D", primary: "#F97316", secondary: "#F59E0B", accent: "#EF4444" }, // Orange/Amber/Red
  {
    name: "E",
    primary: "#A855F7",
    secondary: "#7C3AED",
    accent: "#6366F1",
  }, // Purple/Deep Purple/Indigo
  { name: "F", primary: "#14B8A6", secondary: "#10B981", accent: "#06B6D4" }, // Teal/Green/Cyan
  { name: "G", primary: "#EF4444", secondary: "#EC4899", accent: "#F97316" }, // Red/Pink/Orange
  {
    name: "H",
    primary: "#06B6D4",
    secondary: "#3B82F6",
    accent: "#0EA5E9",
  }, // Cyan/Blue/Light Blue
];

const colorScheme = colorSchemes[colorSchemeIndex];

// 排版系统: Sans-Serif (0-2)
const typographyIndex = (seedNum >> 16) % 3;
const typographySystems = [
  { name: "Serif", fonts: ["Georgia", "Playfair Display", "serif"], scale: 1.2 },
  { name: "Sans-Serif", fonts: ["Inter", "system-ui", "sans-serif"], scale: 1.25 },
  { name: "Monospace", fonts: ["Fira Code", "JetBrains Mono", "monospace"], scale: 1.15 },
];
const typography = typographySystems[typographyIndex];

// 布局模式: Grid (0-4)
const layoutIndex = (seedNum >> 24) % 5;
const layouts = ["sidebar", "masonry", "tabs", "grid", "wizard"];
const layout = layouts[layoutIndex];

// 组件风格: 中圆角 + 中阴影
const borderRadiusPresets = [
  { name: "xs", sm: "2px", md: "4px", lg: "8px", xl: "12px" },
  { name: "sm", sm: "4px", md: "8px", lg: "12px", xl: "16px" },
  { name: "md", sm: "8px", md: "12px", lg: "16px", xl: "24px" },
];
const borderRadiusIndex = (seedNum >> 4) % 3;
const borderRadius = borderRadiusPresets[borderRadiusIndex];

// 动效时长: 标准 200ms
const transitionDurations = [100, 200, 300];
const transitionIndex = (seedNum >> 12) % 3;
const transitionDuration = transitionDurations[transitionIndex];

export const designTokens = {
  system: designSystem,
  seed: seed,

  colors: {
    light: {
      primary: colorScheme.primary,
      secondary: colorScheme.secondary,
      accent: colorScheme.accent,
      background: "#FFFFFF",
      surface: "#F8FAFC",
      surfaceGlass: "rgba(248, 250, 252, 0.7)", // Glassmorphism
      text: "#0F172A",
      textSecondary: "#64748B",
      border: "#E2E8F0",
    },
    dark: {
      primary: colorScheme.primary,
      secondary: colorScheme.secondary,
      accent: colorScheme.accent,
      background: "#0F172A",
      surface: "#1E293B",
      surfaceGlass: "rgba(30, 41, 59, 0.7)", // Glassmorphism
      text: "#F8FAFC",
      textSecondary: "#94A3B8",
      border: "#334155",
    },
  },

  typography: {
    fontFamily: {
      sans: typography.fonts,
      mono: ["JetBrains Mono", "monospace"],
    },
    scale: typography.scale,
    sizes: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.25rem", // 20px
      xl: "1.563rem", // 25px
      "2xl": "1.953rem", // 31px
      "3xl": "2.441rem", // 39px
    },
  },

  spacing: {
    unit: 8, // 基础间距单位 8px
  },

  borderRadius: {
    sm: borderRadius.sm,
    md: borderRadius.md,
    lg: borderRadius.lg,
    xl: borderRadius.xl,
  },

  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 4px 6px rgba(0,0,0,0.1)",
    lg: "0 10px 15px rgba(0,0,0,0.15)",
    xl: "0 20px 25px rgba(0,0,0,0.2)",
  },

  transitions: {
    duration: transitionDuration,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  layout: layout,

  density: {
    compact: {
      padding: { sm: "4px 8px", md: "8px 16px", lg: "12px 24px" },
      gap: "8px",
    },
    comfortable: {
      padding: { sm: "8px 16px", md: "16px 24px", lg: "20px 32px" },
      gap: "16px",
    },
  },

  // Glassmorphism 特有属性
  glassmorphism: {
    blur: "blur(10px)",
    opacity: 0.7,
    border: "1px solid rgba(255, 255, 255, 0.18)",
  },
};

