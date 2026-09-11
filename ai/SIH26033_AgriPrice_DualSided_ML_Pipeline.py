#!/usr/bin/env python3
"""
================================================================================
  SIH26033 — Dual-Sided Agricultural Price & Demand Prediction Engine
  "Eliminating Intermediary Exploitation in Indian Agricultural Markets"
================================================================================

  Author  : SIH Team — Smart India Hackathon 2026
  Problem : SIH26033 — Multiple intermediaries reduce farmers' earnings
            and increase consumer prices.
  Purpose : Production-ready ML pipeline for a dual-sided prediction engine:
            • Farmer Side  → Fair Price + Supply/Yield Forecasting
            • Buyer Side   → Market Price + Demand Proxy Index
            • Arbitrage    → Intermediary Margin Spread Analysis

  Dataset : ml_ready_price_production_dataset_completed.csv
            (~7,989 rows | 4 states | 18 crops | 120 districts | 2012–2016)

  Usage   : Run cells sequentially in Google Colab or as a script.
            Models are exported as .joblib files for FastAPI integration.

  API     : A complete FastAPI server is generated at the end for deployment.
================================================================================
"""

# =============================================================================
# ██████╗ CELL 1: ENVIRONMENT SETUP & IMPORTS
# =============================================================================

# --- Uncomment for Google Colab ---
# !pip install -q pandas numpy scikit-learn xgboost lightgbm matplotlib seaborn joblib fastapi uvicorn pydantic

import warnings
warnings.filterwarnings('ignore')

import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for Windows/headless

import os
import json
import hashlib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

# ML / Preprocessing
from sklearn.model_selection import (
    train_test_split, cross_val_score, GroupKFold, KFold
)
from sklearn.preprocessing import (
    LabelEncoder, StandardScaler, RobustScaler, OrdinalEncoder
)
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    mean_absolute_percentage_error
)
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer

# Gradient-Boosted Models
import xgboost as xgb
import lightgbm as lgb

# Persistence
import joblib

print("✅ All imports successful.")
print(f"   NumPy: {np.__version__}")
print(f"   Pandas: {pd.__version__}")
print(f"   XGBoost: {xgb.__version__}")
print(f"   LightGBM: {lgb.__version__}")

# =============================================================================
# ██████╗ CELL 2: CONFIGURATION
# =============================================================================

class Config:
    """Central configuration for the entire pipeline."""

    # --- Paths (Update for your environment) ---
    DATA_PATH = "ml_ready_price_production_dataset_completed.csv"
    # For Colab: "/content/ml_ready_price_production_dataset_completed.csv"
    MODEL_OUTPUT_DIR = "./models"
    API_OUTPUT_DIR = "./api"

    # --- Column Schema ---
    CAT_COLS = ['state', 'district', 'crop', 'season']
    TEMPORAL_COL = 'year'
    SUPPLY_COLS = ['area', 'production', 'yield']
    PRICE_COLS = ['msp_rs_per_quintal', 'estimated_value_inr',
                  'market_price_rs_per_quintal', 'n_price_reports',
                  'estimated_value_market_inr']

    # --- Model targets ---
    # Farmer Side
    FARMER_PRICE_TARGET = 'fair_farmgate_price'         # Engineered
    FARMER_PRODUCTION_TARGET = 'production'
    FARMER_YIELD_TARGET = 'yield'

    # Buyer Side
    BUYER_MARKET_PRICE_TARGET = 'market_price_rs_per_quintal'
    BUYER_DEMAND_INDEX_TARGET = 'demand_proxy_index'    # Engineered

    # --- Training ---
    TEST_SIZE = 0.2
    RANDOM_STATE = 42
    CV_FOLDS = 5

    # --- Feature Engineering ---
    LAG_YEARS = [1, 2]  # Create 1-year and 2-year lags

config = Config()
os.makedirs(config.MODEL_OUTPUT_DIR, exist_ok=True)
os.makedirs(config.API_OUTPUT_DIR, exist_ok=True)
print("✅ Configuration loaded.")


# =============================================================================
# ██████╗ CELL 3: DATA LOADING & INITIAL EDA
# =============================================================================

def load_and_inspect(path: str) -> pd.DataFrame:
    """Load dataset and print comprehensive summary."""
    df = pd.read_csv(path)
    print(f"{'='*70}")
    print(f"  DATASET LOADED: {path}")
    print(f"{'='*70}")
    print(f"  Shape           : {df.shape[0]:,} rows × {df.shape[1]} columns")
    print(f"  Memory          : {df.memory_usage(deep=True).sum()/1e6:.2f} MB")
    print(f"  Year range      : {df['year'].min()} – {df['year'].max()}")
    print(f"  States          : {df['state'].nunique()} → {df['state'].unique().tolist()}")
    print(f"  Districts       : {df['district'].nunique()}")
    print(f"  Crops           : {df['crop'].nunique()} → {df['crop'].unique().tolist()}")
    print(f"  Seasons         : {df['season'].nunique()} → {df['season'].unique().tolist()}")
    print(f"{'='*70}")

    print("\n📊 Missing Values:")
    missing = df.isnull().sum()
    missing_pct = (df.isnull().sum() / len(df) * 100).round(2)
    missing_df = pd.DataFrame({'Count': missing, 'Percent': missing_pct})
    print(missing_df[missing_df['Count'] > 0].to_string() if missing_df['Count'].any() else "  None!")

    print("\n📊 Numeric Summary:")
    print(df.describe().round(2).to_string())

    return df

df_raw = load_and_inspect(config.DATA_PATH)


# =============================================================================
# ██████╗ CELL 4: DATA CLEANING & TYPE CASTING
# =============================================================================

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean, type-cast, and handle missing values."""
    df = df.copy()

    # --- Type casting ---
    numeric_cols = ['area', 'production', 'yield', 'msp_rs_per_quintal',
                    'estimated_value_inr', 'market_price_rs_per_quintal',
                    'n_price_reports', 'estimated_value_market_inr']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    df['year'] = df['year'].astype(int)

    # --- String cleaning ---
    for col in config.CAT_COLS:
        df[col] = df[col].str.strip().str.title()

    # --- Handle zero yields (avoid division errors) ---
    df.loc[df['yield'] == 0, 'yield'] = np.nan
    df.loc[df['production'] == 0, 'production'] = np.nan

    # --- Fill n_price_reports & estimated_value_market_inr ---
    # These are missing for ~46% of rows. We impute with crop-state-season medians.
    for col in ['n_price_reports', 'estimated_value_market_inr']:
        medians = df.groupby(['crop', 'state', 'season'])[col].transform('median')
        df[col] = df[col].fillna(medians)
        # Remaining NaNs → global median
        df[col] = df[col].fillna(df[col].median())

    # --- Fill remaining numeric NaNs with group medians ---
    for col in numeric_cols:
        if df[col].isnull().any():
            medians = df.groupby(['crop', 'state'])[col].transform('median')
            df[col] = df[col].fillna(medians)
            df[col] = df[col].fillna(df[col].median())

    # --- Drop rows where critical columns are still NaN ---
    critical = ['msp_rs_per_quintal', 'market_price_rs_per_quintal', 'area']
    df = df.dropna(subset=critical).reset_index(drop=True)

    print(f"✅ Data cleaned. Shape after cleaning: {df.shape}")
    print(f"   Remaining NaNs: {df.isnull().sum().sum()}")
    return df

df_clean = clean_data(df_raw)


# =============================================================================
# ██████╗ CELL 5: FEATURE ENGINEERING (THE CORE)
# =============================================================================

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer all features needed for dual-sided prediction.

    Creates:
      • Lag features (price, production, yield for previous years)
      • Rolling statistics (mean, std for price volatility)
      • Ratio features (yield efficiency, MSP coverage, etc.)
      • Fair Farmgate Price (target for Farmer Side)
      • Demand Proxy Index (target for Buyer Side)
      • Intermediary Margin Spread
    """
    df = df.copy()
    df = df.sort_values(['state', 'district', 'crop', 'season', 'year']).reset_index(drop=True)

    group_key = ['state', 'district', 'crop', 'season']

    # ─────────────────────────────────────────────
    # 1. LAG FEATURES (previous year's values)
    # ─────────────────────────────────────────────
    lag_targets = {
        'market_price_rs_per_quintal': 'lag_market_price',
        'msp_rs_per_quintal': 'lag_msp',
        'production': 'lag_production',
        'yield': 'lag_yield',
        'n_price_reports': 'lag_n_reports',
    }
    for col, prefix in lag_targets.items():
        for lag in config.LAG_YEARS:
            col_name = f"{prefix}_{lag}y"
            df[col_name] = df.groupby(group_key)[col].shift(lag)

    # ─────────────────────────────────────────────
    # 2. YEAR-OVER-YEAR CHANGE RATES
    # ─────────────────────────────────────────────
    df['price_yoy_change'] = (
        (df['market_price_rs_per_quintal'] - df['lag_market_price_1y'])
        / df['lag_market_price_1y'].replace(0, np.nan)
    )
    df['production_yoy_change'] = (
        (df['production'] - df['lag_production_1y'])
        / df['lag_production_1y'].replace(0, np.nan)
    )
    df['yield_yoy_change'] = (
        (df['yield'] - df['lag_yield_1y'])
        / df['lag_yield_1y'].replace(0, np.nan)
    )
    df['msp_yoy_change'] = (
        (df['msp_rs_per_quintal'] - df['lag_msp_1y'])
        / df['lag_msp_1y'].replace(0, np.nan)
    )

    # ─────────────────────────────────────────────
    # 3. ROLLING STATISTICS (Price Volatility)
    # ─────────────────────────────────────────────
    # Rolling mean and std of market price over available years
    df['rolling_price_mean'] = (
        df.groupby(group_key)['market_price_rs_per_quintal']
        .transform(lambda x: x.rolling(3, min_periods=1).mean())
    )
    df['rolling_price_std'] = (
        df.groupby(group_key)['market_price_rs_per_quintal']
        .transform(lambda x: x.rolling(3, min_periods=1).std())
    )
    df['rolling_price_std'] = df['rolling_price_std'].fillna(0)

    # Price volatility coefficient (CV)
    df['price_volatility_cv'] = (
        df['rolling_price_std'] / df['rolling_price_mean'].replace(0, np.nan)
    )

    # ─────────────────────────────────────────────
    # 4. RATIO & INTERACTION FEATURES
    # ─────────────────────────────────────────────

    # MSP Coverage Ratio: How much of market price is covered by MSP
    df['msp_coverage_ratio'] = (
        df['msp_rs_per_quintal'] / df['market_price_rs_per_quintal'].replace(0, np.nan)
    )

    # Yield Efficiency: yield relative to state-crop average
    state_crop_yield_mean = df.groupby(['state', 'crop'])['yield'].transform('mean')
    df['yield_efficiency'] = df['yield'] / state_crop_yield_mean.replace(0, np.nan)

    # Area Intensity: area relative to district average
    district_area_mean = df.groupby(['district'])['area'].transform('mean')
    df['area_intensity'] = df['area'] / district_area_mean.replace(0, np.nan)

    # Production per unit area (same as yield, but cross-validated)
    df['production_per_area'] = df['production'] / df['area'].replace(0, np.nan)

    # Value per quintal from estimated values
    df['value_per_quintal_est'] = (
        df['estimated_value_inr'] / df['production'].replace(0, np.nan)
    )

    # Market value realization ratio
    df['market_value_realization'] = (
        df['estimated_value_market_inr'] / df['estimated_value_inr'].replace(0, np.nan)
    )

    # ─────────────────────────────────────────────
    # 5. TARGET ENGINEERING
    # ─────────────────────────────────────────────

    # ── FARMER SIDE: Fair Farmgate Price ──
    # Weighted blend: 40% MSP + 35% market price + 25% estimated value/quintal
    # This represents what a farmer SHOULD receive without intermediary exploitation
    df['fair_farmgate_price'] = (
        0.40 * df['msp_rs_per_quintal']
        + 0.35 * df['market_price_rs_per_quintal']
        + 0.25 * df['value_per_quintal_est'].fillna(df['msp_rs_per_quintal'])
    )

    # ── BUYER SIDE: Demand Proxy Index ──
    # Composite index from: market arrivals (n_price_reports), production trends,
    # price volatility. Normalized to 0-100 scale.
    # Higher index = higher demand pressure
    df['demand_raw'] = (
        0.45 * df['n_price_reports'].rank(pct=True)           # Market activity
        + 0.30 * (1 - df['production'].rank(pct=True))         # Lower supply → higher demand signal
        + 0.25 * df['price_volatility_cv'].rank(pct=True)      # Higher volatility → demand uncertainty
    )
    df['demand_proxy_index'] = (
        (df['demand_raw'] - df['demand_raw'].min())
        / (df['demand_raw'].max() - df['demand_raw'].min())
        * 100
    )

    # ── INTERMEDIARY MARGIN SPREAD ──
    df['intermediary_margin_spread'] = (
        df['market_price_rs_per_quintal'] - df['msp_rs_per_quintal']
    )
    df['intermediary_margin_pct'] = (
        df['intermediary_margin_spread'] / df['msp_rs_per_quintal'].replace(0, np.nan) * 100
    )

    # ─────────────────────────────────────────────
    # 6. CROP-LEVEL AGGREGATES (state-level context)
    # ─────────────────────────────────────────────
    for agg_col in ['market_price_rs_per_quintal', 'production', 'yield']:
        state_mean = df.groupby(['state', 'crop', 'year'])[agg_col].transform('mean')
        df[f'state_avg_{agg_col}'] = state_mean

    # ─────────────────────────────────────────────
    # 7. FILL INFs AND REMAINING NANS
    # ─────────────────────────────────────────────
    df = df.replace([np.inf, -np.inf], np.nan)

    # Fill NaN lag/rolling features with column medians
    feature_cols = [c for c in df.columns if c not in config.CAT_COLS + ['year']]
    for col in feature_cols:
        if df[col].isnull().any():
            df[col] = df[col].fillna(df[col].median())

    print(f"✅ Feature engineering complete. New shape: {df.shape}")
    print(f"   Total features: {len(df.columns)}")
    print(f"   Engineered features: {len(df.columns) - 13}")
    print(f"   Remaining NaNs: {df.isnull().sum().sum()}")

    return df

df_feat = engineer_features(df_clean)


# =============================================================================
# ██████╗ CELL 6: EXPLORATORY DATA ANALYSIS — VISUALIZATIONS
# =============================================================================

def plot_eda(df: pd.DataFrame):
    """Generate key EDA visualizations."""
    fig, axes = plt.subplots(2, 3, figsize=(20, 12))
    fig.suptitle('SIH26033 — Agricultural Data EDA', fontsize=16, fontweight='bold')

    # 1. Market Price Distribution by Crop
    ax = axes[0, 0]
    crop_prices = df.groupby('crop')['market_price_rs_per_quintal'].median().sort_values()
    crop_prices.plot(kind='barh', ax=ax, color=sns.color_palette('viridis', len(crop_prices)))
    ax.set_title('Median Market Price by Crop (₹/quintal)')
    ax.set_xlabel('₹ per Quintal')

    # 2. Intermediary Margin Spread Distribution
    ax = axes[0, 1]
    df['intermediary_margin_spread'].hist(bins=50, ax=ax, color='#e74c3c', alpha=0.7, edgecolor='black')
    ax.axvline(0, color='black', linestyle='--', linewidth=2)
    ax.set_title('Intermediary Margin Spread Distribution')
    ax.set_xlabel('Market Price − MSP (₹/quintal)')

    # 3. MSP vs Market Price
    ax = axes[0, 2]
    sample = df.sample(min(1000, len(df)), random_state=42)
    ax.scatter(sample['msp_rs_per_quintal'], sample['market_price_rs_per_quintal'],
               alpha=0.4, s=15, c='#3498db')
    lims = [0, max(df['msp_rs_per_quintal'].max(), df['market_price_rs_per_quintal'].max()) * 1.1]
    ax.plot(lims, lims, 'r--', linewidth=2, label='MSP = Market Price')
    ax.set_xlabel('MSP (₹/quintal)')
    ax.set_ylabel('Market Price (₹/quintal)')
    ax.set_title('MSP vs Market Price')
    ax.legend()

    # 4. Demand Proxy Index by Season
    ax = axes[1, 0]
    sns.boxplot(data=df, x='season', y='demand_proxy_index', ax=ax, palette='Set2')
    ax.set_title('Demand Proxy Index by Season')

    # 5. Fair Farmgate Price vs Market Price
    ax = axes[1, 1]
    ax.scatter(sample['fair_farmgate_price'], sample['market_price_rs_per_quintal'],
               alpha=0.4, s=15, c='#2ecc71')
    ax.plot([0, lims[1]], [0, lims[1]], 'r--', linewidth=2)
    ax.set_xlabel('Fair Farmgate Price (₹/quintal)')
    ax.set_ylabel('Market Price (₹/quintal)')
    ax.set_title('Fair Farmgate vs Market Price')

    # 6. Year-over-Year Price Trends
    ax = axes[1, 2]
    yearly = df.groupby('year').agg({
        'market_price_rs_per_quintal': 'mean',
        'msp_rs_per_quintal': 'mean',
        'fair_farmgate_price': 'mean'
    })
    yearly.plot(ax=ax, marker='o', linewidth=2)
    ax.set_title('Average Price Trends Over Years')
    ax.set_ylabel('₹ per Quintal')
    ax.legend(['Market Price', 'MSP', 'Fair Farmgate'], fontsize=8)

    plt.tight_layout()
    plt.savefig(os.path.join(config.MODEL_OUTPUT_DIR, 'eda_plots.png'), dpi=150, bbox_inches='tight')
    plt.close('all')
    print("✅ EDA plots saved.")

plot_eda(df_feat)


# =============================================================================
# ██████╗ CELL 7: PREPROCESSING PIPELINE
# =============================================================================

class PreprocessingPipeline:
    """
    Encapsulates all preprocessing: encoding, scaling, feature selection.
    Serializable for API deployment.
    """

    def __init__(self):
        self.label_encoders = {}
        self.scaler = RobustScaler()
        self.feature_cols = []
        self.cat_cols = config.CAT_COLS
        self.fitted = False

    def fit(self, df: pd.DataFrame, target_col: str):
        """Fit encoders and scaler on training data."""
        df = df.copy()

        # Encode categoricals
        for col in self.cat_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            self.label_encoders[col] = le

        # Determine feature columns (everything except targets and identifiers)
        exclude = [
            'fair_farmgate_price', 'demand_proxy_index', 'demand_raw',
            'intermediary_margin_spread', 'intermediary_margin_pct',
            'estimated_value_inr', 'estimated_value_market_inr',  # Leaky for price prediction
        ]
        self.feature_cols = [
            c for c in df.columns
            if c not in exclude and c != target_col
            and df[c].dtype in ['int64', 'float64', 'int32', 'float32']
        ]

        # Fit scaler
        self.scaler.fit(df[self.feature_cols])
        self.fitted = True

        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform data using fitted encoders and scaler."""
        df = df.copy()

        for col in self.cat_cols:
            if col in self.label_encoders:
                le = self.label_encoders[col]
                # Handle unseen categories
                df[col] = df[col].astype(str).map(
                    lambda x, le=le: le.transform([x])[0]
                    if x in le.classes_ else -1
                )

        # Scale numeric features
        available_feats = [f for f in self.feature_cols if f in df.columns]
        df[available_feats] = self.scaler.transform(df[available_feats])

        return df

    def get_features(self, df: pd.DataFrame) -> np.ndarray:
        """Extract feature matrix from transformed dataframe."""
        available_feats = [f for f in self.feature_cols if f in df.columns]
        return df[available_feats].values

    def save(self, path: str):
        joblib.dump(self, path)
        print(f"   💾 Pipeline saved → {path}")

    @staticmethod
    def load(path: str):
        return joblib.load(path)


# =============================================================================
# ██████╗ CELL 8: MODEL TRAINING FRAMEWORK
# =============================================================================

class ModelTrainer:
    """
    Unified training framework for all prediction targets.
    Supports XGBoost and LightGBM with automated evaluation.
    """

    def __init__(self, name: str, target_col: str, model_type: str = 'xgb'):
        self.name = name
        self.target_col = target_col
        self.model_type = model_type
        self.model = None
        self.pipeline = None
        self.metrics = {}
        self.feature_importance = None

    def _create_model(self) -> object:
        """Create model instance with optimized hyperparameters."""
        if self.model_type == 'xgb':
            return xgb.XGBRegressor(
                n_estimators=500,
                max_depth=8,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                min_child_weight=5,
                reg_alpha=0.1,
                reg_lambda=1.0,
                random_state=config.RANDOM_STATE,
                n_jobs=-1,
                verbosity=0,
                early_stopping_rounds=30,
            )
        elif self.model_type == 'lgb':
            return lgb.LGBMRegressor(
                n_estimators=500,
                max_depth=8,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                min_child_samples=10,
                reg_alpha=0.1,
                reg_lambda=1.0,
                random_state=config.RANDOM_STATE,
                n_jobs=-1,
                verbose=-1,
            )

    def train(self, df: pd.DataFrame):
        """Full training pipeline: preprocess → split → train → evaluate."""
        print(f"\n{'='*70}")
        print(f"  🚀 TRAINING: {self.name}")
        print(f"     Target: {self.target_col} | Model: {self.model_type.upper()}")
        print(f"{'='*70}")

        # --- Preprocessing ---
        self.pipeline = PreprocessingPipeline()
        self.pipeline.fit(df, self.target_col)

        df_processed = self.pipeline.transform(df)

        X = self.pipeline.get_features(df_processed)
        y = df[self.target_col].values

        # Remove NaN targets
        valid_mask = ~np.isnan(y)
        X, y = X[valid_mask], y[valid_mask]

        print(f"   Dataset size: {X.shape[0]:,} samples × {X.shape[1]} features")

        # --- Train/Test Split ---
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=config.TEST_SIZE, random_state=config.RANDOM_STATE
        )

        # --- Model Training ---
        self.model = self._create_model()

        if self.model_type == 'xgb':
            self.model.fit(
                X_train, y_train,
                eval_set=[(X_test, y_test)],
                verbose=False,
            )
        else:
            self.model.fit(
                X_train, y_train,
                eval_set=[(X_test, y_test)],
                callbacks=[lgb.early_stopping(30, verbose=False),
                           lgb.log_evaluation(period=0)],
            )

        # --- Evaluation ---
        y_pred_train = self.model.predict(X_train)
        y_pred_test = self.model.predict(X_test)

        self.metrics = {
            'train': self._compute_metrics(y_train, y_pred_train),
            'test': self._compute_metrics(y_test, y_pred_test),
        }

        # --- Cross-Validation ---
        cv_scores = cross_val_score(
            self._create_model_for_cv(), X, y,
            cv=config.CV_FOLDS, scoring='r2', n_jobs=-1
        )
        self.metrics['cv_r2_mean'] = cv_scores.mean()
        self.metrics['cv_r2_std'] = cv_scores.std()

        # --- Feature Importance ---
        self.feature_importance = pd.DataFrame({
            'feature': self.pipeline.feature_cols,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)

        # --- Print Results ---
        self._print_results()

        return self

    def _create_model_for_cv(self):
        """Create a simpler model for cross-validation (no early stopping)."""
        if self.model_type == 'xgb':
            return xgb.XGBRegressor(
                n_estimators=300, max_depth=8, learning_rate=0.05,
                subsample=0.8, colsample_bytree=0.8, min_child_weight=5,
                random_state=config.RANDOM_STATE, n_jobs=-1, verbosity=0,
            )
        else:
            return lgb.LGBMRegressor(
                n_estimators=300, max_depth=8, learning_rate=0.05,
                subsample=0.8, colsample_bytree=0.8, min_child_samples=10,
                random_state=config.RANDOM_STATE, n_jobs=-1, verbose=-1,
            )

    @staticmethod
    def _compute_metrics(y_true, y_pred):
        return {
            'MAE': mean_absolute_error(y_true, y_pred),
            'RMSE': np.sqrt(mean_squared_error(y_true, y_pred)),
            'R2': r2_score(y_true, y_pred),
            'MAPE': mean_absolute_percentage_error(y_true, y_pred) * 100,
        }

    def _print_results(self):
        print(f"\n   📈 RESULTS:")
        print(f"   {'Metric':<10} {'Train':>12} {'Test':>12}")
        print(f"   {'─'*36}")
        for metric in ['MAE', 'RMSE', 'R2', 'MAPE']:
            train_val = self.metrics['train'][metric]
            test_val = self.metrics['test'][metric]
            fmt = '.2f' if metric != 'R2' else '.4f'
            print(f"   {metric:<10} {train_val:>12{fmt}} {test_val:>12{fmt}}")
        print(f"\n   🔄 Cross-Validation R² : {self.metrics['cv_r2_mean']:.4f} ± {self.metrics['cv_r2_std']:.4f}")

        print(f"\n   🏆 Top 10 Features:")
        for _, row in self.feature_importance.head(10).iterrows():
            bar = '█' * int(row['importance'] * 50)
            print(f"     {row['feature']:<35} {row['importance']:.4f} {bar}")

    def save(self, output_dir: str):
        """Save model and pipeline for API deployment."""
        model_path = os.path.join(output_dir, f"{self.name}_model.joblib")
        pipeline_path = os.path.join(output_dir, f"{self.name}_pipeline.joblib")
        meta_path = os.path.join(output_dir, f"{self.name}_meta.json")

        joblib.dump(self.model, model_path)
        self.pipeline.save(pipeline_path)

        meta = {
            'name': self.name,
            'target': self.target_col,
            'model_type': self.model_type,
            'features': self.pipeline.feature_cols,
            'metrics': {
                'test_r2': self.metrics['test']['R2'],
                'test_mae': self.metrics['test']['MAE'],
                'test_rmse': self.metrics['test']['RMSE'],
                'cv_r2': self.metrics['cv_r2_mean'],
            },
            'trained_at': datetime.now().isoformat(),
        }
        with open(meta_path, 'w') as f:
            json.dump(meta, f, indent=2)

        print(f"   💾 Model saved → {model_path}")
        print(f"   💾 Metadata saved → {meta_path}")

    def plot_results(self, df: pd.DataFrame):
        """Plot actual vs predicted and feature importance."""
        fig, axes = plt.subplots(1, 2, figsize=(16, 6))
        fig.suptitle(f'{self.name} — Model Performance', fontsize=14, fontweight='bold')

        # --- Actual vs Predicted ---
        df_processed = self.pipeline.transform(df)
        X = self.pipeline.get_features(df_processed)
        y = df[self.target_col].values
        valid = ~np.isnan(y)
        y_pred = self.model.predict(X[valid])
        y_true = y[valid]

        ax = axes[0]
        ax.scatter(y_true, y_pred, alpha=0.3, s=10, c='#3498db')
        lim = max(y_true.max(), y_pred.max()) * 1.1
        ax.plot([0, lim], [0, lim], 'r--', linewidth=2)
        ax.set_xlabel('Actual')
        ax.set_ylabel('Predicted')
        ax.set_title(f'Actual vs Predicted (R² = {self.metrics["test"]["R2"]:.4f})')

        # --- Feature Importance ---
        ax = axes[1]
        top_feat = self.feature_importance.head(15)
        ax.barh(top_feat['feature'], top_feat['importance'], color=sns.color_palette('viridis', 15))
        ax.set_title('Top 15 Feature Importances')
        ax.invert_yaxis()

        plt.tight_layout()
        plt.savefig(os.path.join(config.MODEL_OUTPUT_DIR, f'{self.name}_results.png'),
                    dpi=150, bbox_inches='tight')
        plt.close('all')


# =============================================================================
# ██████╗ CELL 9: TRAIN ALL MODELS
# =============================================================================

print("\n" + "🌾"*35)
print("  TRAINING ALL MODELS — DUAL-SIDED PREDICTION ENGINE")
print("🌾"*35)

# ── FARMER SIDE ──────────────────────────────────────

# Model 1: Fair Farmgate Price Prediction
farmer_price_trainer = ModelTrainer(
    name="farmer_fair_price",
    target_col=config.FARMER_PRICE_TARGET,
    model_type='xgb'
)
farmer_price_trainer.train(df_feat)
farmer_price_trainer.save(config.MODEL_OUTPUT_DIR)
farmer_price_trainer.plot_results(df_feat)

# Model 2: Production Volume Forecasting
farmer_production_trainer = ModelTrainer(
    name="farmer_production",
    target_col=config.FARMER_PRODUCTION_TARGET,
    model_type='lgb'
)
farmer_production_trainer.train(df_feat)
farmer_production_trainer.save(config.MODEL_OUTPUT_DIR)
farmer_production_trainer.plot_results(df_feat)

# Model 3: Yield Forecasting
farmer_yield_trainer = ModelTrainer(
    name="farmer_yield",
    target_col=config.FARMER_YIELD_TARGET,
    model_type='lgb'
)
farmer_yield_trainer.train(df_feat)
farmer_yield_trainer.save(config.MODEL_OUTPUT_DIR)
farmer_yield_trainer.plot_results(df_feat)

# ── BUYER SIDE ───────────────────────────────────────

# Model 4: Market Price Prediction
buyer_price_trainer = ModelTrainer(
    name="buyer_market_price",
    target_col=config.BUYER_MARKET_PRICE_TARGET,
    model_type='xgb'
)
buyer_price_trainer.train(df_feat)
buyer_price_trainer.save(config.MODEL_OUTPUT_DIR)
buyer_price_trainer.plot_results(df_feat)

# Model 5: Demand Proxy Index
buyer_demand_trainer = ModelTrainer(
    name="buyer_demand_index",
    target_col=config.BUYER_DEMAND_INDEX_TARGET,
    model_type='lgb'
)
buyer_demand_trainer.train(df_feat)
buyer_demand_trainer.save(config.MODEL_OUTPUT_DIR)
buyer_demand_trainer.plot_results(df_feat)


# =============================================================================
# ██████╗ CELL 10: MODEL COMPARISON DASHBOARD
# =============================================================================

def print_model_dashboard(trainers: list):
    """Print a summary dashboard of all trained models."""
    print(f"\n{'='*80}")
    print(f"  📊 MODEL COMPARISON DASHBOARD")
    print(f"{'='*80}")
    print(f"  {'Model':<25} {'R² (Test)':>10} {'MAE':>10} {'RMSE':>12} {'CV R²':>10}")
    print(f"  {'─'*70}")
    for t in trainers:
        print(f"  {t.name:<25} "
              f"{t.metrics['test']['R2']:>10.4f} "
              f"{t.metrics['test']['MAE']:>10.2f} "
              f"{t.metrics['test']['RMSE']:>12.2f} "
              f"{t.metrics['cv_r2_mean']:>10.4f}")
    print(f"{'='*80}")

all_trainers = [
    farmer_price_trainer,
    farmer_production_trainer,
    farmer_yield_trainer,
    buyer_price_trainer,
    buyer_demand_trainer,
]
print_model_dashboard(all_trainers)


# =============================================================================
# ██████╗ CELL 11: INTERMEDIARY MARGIN ANALYSIS
# =============================================================================

def analyze_intermediary_margins(df: pd.DataFrame):
    """Comprehensive intermediary margin / arbitrage analysis."""
    print(f"\n{'='*70}")
    print(f"  💰 INTERMEDIARY MARGIN ARBITRAGE ANALYSIS")
    print(f"{'='*70}")

    # Overall statistics
    spread = df['intermediary_margin_spread']
    margin_pct = df['intermediary_margin_pct']

    print(f"\n  📊 Overall Spread Statistics (Market Price − MSP):")
    print(f"     Mean Spread      : ₹{spread.mean():,.2f} / quintal")
    print(f"     Median Spread    : ₹{spread.median():,.2f} / quintal")
    print(f"     Std Dev          : ₹{spread.std():,.2f}")
    print(f"     Max Spread       : ₹{spread.max():,.2f}")
    print(f"     Min Spread       : ₹{spread.min():,.2f}")
    print(f"     Mean Margin %    : {margin_pct.mean():.2f}%")

    # Flag excessive margins (>50% above MSP)
    excessive = df[df['intermediary_margin_pct'] > 50]
    print(f"\n  ⚠️  Excessive Margins (>50% above MSP): {len(excessive):,} records "
          f"({len(excessive)/len(df)*100:.1f}%)")

    # Negative margins (market < MSP — distress selling indicators)
    distress = df[df['intermediary_margin_spread'] < 0]
    print(f"  🚨 Distress Selling (Market < MSP): {len(distress):,} records "
          f"({len(distress)/len(df)*100:.1f}%)")

    # By Crop
    print(f"\n  📊 Margin Spread by Crop:")
    crop_margins = df.groupby('crop').agg({
        'intermediary_margin_spread': ['mean', 'median'],
        'intermediary_margin_pct': 'mean'
    }).round(2)
    crop_margins.columns = ['Mean Spread (₹)', 'Median Spread (₹)', 'Mean Margin %']
    crop_margins = crop_margins.sort_values('Mean Margin %', ascending=False)
    print(crop_margins.to_string())

    # By State
    print(f"\n  📊 Margin Spread by State:")
    state_margins = df.groupby('state').agg({
        'intermediary_margin_spread': ['mean', 'median'],
        'intermediary_margin_pct': 'mean'
    }).round(2)
    state_margins.columns = ['Mean Spread (₹)', 'Median Spread (₹)', 'Mean Margin %']
    print(state_margins.to_string())

    # Visualization
    fig, axes = plt.subplots(1, 3, figsize=(20, 6))
    fig.suptitle('Intermediary Margin Analysis', fontsize=14, fontweight='bold')

    # By Crop
    ax = axes[0]
    crop_margins['Mean Margin %'].sort_values().plot(kind='barh', ax=ax, color='#e74c3c')
    ax.set_title('Mean Margin % by Crop')
    ax.axvline(0, color='black', linestyle='--')

    # By State
    ax = axes[1]
    state_margins['Mean Margin %'].sort_values().plot(kind='barh', ax=ax, color='#3498db')
    ax.set_title('Mean Margin % by State')

    # Over Time
    ax = axes[2]
    yearly_margin = df.groupby('year')['intermediary_margin_pct'].mean()
    yearly_margin.plot(marker='o', linewidth=2, ax=ax, color='#2ecc71')
    ax.set_title('Average Intermediary Margin % Over Years')
    ax.set_ylabel('Margin %')

    plt.tight_layout()
    plt.savefig(os.path.join(config.MODEL_OUTPUT_DIR, 'margin_analysis.png'),
                dpi=150, bbox_inches='tight')
    plt.close('all')

analyze_intermediary_margins(df_feat)


# =============================================================================
# ██████╗ CELL 12: PREDICTION HELPER — UNIFIED PREDICTION ENGINE
# =============================================================================

class AgriPredictionEngine:
    """
    Unified prediction engine that loads all trained models and provides
    a single interface for both farmer-side and buyer-side predictions.
    This is the class deployed behind the FastAPI server.
    """

    def __init__(self, model_dir: str = "./models"):
        self.model_dir = model_dir
        self.models = {}
        self.pipelines = {}
        self.metadata = {}
        self._load_all()

    def _load_all(self):
        """Load all models, pipelines, and metadata from disk."""
        model_names = [
            'farmer_fair_price',
            'farmer_production',
            'farmer_yield',
            'buyer_market_price',
            'buyer_demand_index',
        ]
        for name in model_names:
            model_path = os.path.join(self.model_dir, f"{name}_model.joblib")
            pipeline_path = os.path.join(self.model_dir, f"{name}_pipeline.joblib")
            meta_path = os.path.join(self.model_dir, f"{name}_meta.json")

            if os.path.exists(model_path):
                self.models[name] = joblib.load(model_path)
                self.pipelines[name] = joblib.load(pipeline_path)
                with open(meta_path, 'r') as f:
                    self.metadata[name] = json.load(f)
                print(f"   ✅ Loaded: {name} (R² = {self.metadata[name]['metrics']['test_r2']:.4f})")

    def predict_farmer_side(self, input_data: dict) -> dict:
        """
        Farmer-side prediction: Fair price + production + yield forecast.

        Args:
            input_data: dict with keys matching dataset schema
                Required: state, district, crop, year, season, area,
                          msp_rs_per_quintal

        Returns:
            dict with predicted values and advisory
        """
        df_input = self._prepare_input(input_data)

        # Predict fair farmgate price
        fair_price = self._predict_single('farmer_fair_price', df_input)

        # Predict production volume
        production = self._predict_single('farmer_production', df_input)

        # Predict yield
        yield_pred = self._predict_single('farmer_yield', df_input)

        # Market price for margin analysis
        market_price = self._predict_single('buyer_market_price', df_input)

        # Intermediary margin
        msp = input_data.get('msp_rs_per_quintal', 0)
        margin_spread = market_price - msp if market_price and msp else None
        margin_pct = (margin_spread / msp * 100) if margin_spread and msp else None

        # Advisory
        advisory = self._generate_farmer_advisory(fair_price, market_price, msp, production)

        return {
            'predictions': {
                'fair_farmgate_price_per_quintal': round(fair_price, 2) if fair_price else None,
                'predicted_production_tonnes': round(production, 2) if production else None,
                'predicted_yield_tonnes_per_ha': round(yield_pred, 4) if yield_pred else None,
                'expected_market_price': round(market_price, 2) if market_price else None,
            },
            'margin_analysis': {
                'msp_rs_per_quintal': msp,
                'intermediary_margin_spread': round(margin_spread, 2) if margin_spread else None,
                'intermediary_margin_pct': round(margin_pct, 2) if margin_pct else None,
                'is_below_msp': market_price < msp if market_price and msp else None,
                'is_excessive_margin': margin_pct > 50 if margin_pct else None,
            },
            'advisory': advisory,
        }

    def predict_buyer_side(self, input_data: dict) -> dict:
        """
        Buyer-side prediction: Market price + demand index.

        Args:
            input_data: dict with keys matching dataset schema

        Returns:
            dict with predicted values and market intelligence
        """
        df_input = self._prepare_input(input_data)

        # Predict market price
        market_price = self._predict_single('buyer_market_price', df_input)

        # Predict demand index
        demand_index = self._predict_single('buyer_demand_index', df_input)

        # Production forecast for supply context
        production = self._predict_single('farmer_production', df_input)

        # Fair price for comparison
        fair_price = self._predict_single('farmer_fair_price', df_input)

        msp = input_data.get('msp_rs_per_quintal', 0)

        return {
            'predictions': {
                'expected_market_price_per_quintal': round(market_price, 2) if market_price else None,
                'demand_proxy_index': round(demand_index, 2) if demand_index else None,
                'supply_forecast_tonnes': round(production, 2) if production else None,
                'fair_farmgate_reference': round(fair_price, 2) if fair_price else None,
            },
            'market_intelligence': {
                'demand_level': self._classify_demand(demand_index),
                'price_vs_msp_premium': round(((market_price / msp) - 1) * 100, 2)
                    if market_price and msp else None,
                'procurement_advisory': self._generate_buyer_advisory(
                    market_price, demand_index, production, msp
                ),
            },
        }

    def _prepare_input(self, input_data: dict) -> pd.DataFrame:
        """Convert input dict to a DataFrame with all necessary features."""
        # Create a single-row DataFrame
        df = pd.DataFrame([input_data])

        # Add default values for missing columns
        defaults = {
            'area': 100, 'production': 500, 'yield': 5.0,
            'n_price_reports': 100, 'estimated_value_inr': 0,
            'estimated_value_market_inr': 0, 'market_price_rs_per_quintal': 0,
        }
        for col, default in defaults.items():
            if col not in df.columns:
                df[col] = default

        # Add engineered features (simplified for single-row prediction)
        df = self._add_prediction_features(df)

        return df

    def _add_prediction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add engineered features for prediction input."""
        df = df.copy()

        # Lag features (set to current values for single prediction)
        for lag in config.LAG_YEARS:
            df[f'lag_market_price_{lag}y'] = df.get('market_price_rs_per_quintal', 0)
            df[f'lag_msp_{lag}y'] = df.get('msp_rs_per_quintal', 0)
            df[f'lag_production_{lag}y'] = df.get('production', 0)
            df[f'lag_yield_{lag}y'] = df.get('yield', 0)
            df[f'lag_n_reports_{lag}y'] = df.get('n_price_reports', 0)

        # YoY changes (default to 0 for single prediction)
        for col in ['price_yoy_change', 'production_yoy_change',
                     'yield_yoy_change', 'msp_yoy_change']:
            df[col] = 0

        # Rolling stats
        df['rolling_price_mean'] = df.get('market_price_rs_per_quintal', 0)
        df['rolling_price_std'] = 0
        df['price_volatility_cv'] = 0

        # Ratios
        msp = df['msp_rs_per_quintal'].iloc[0] if 'msp_rs_per_quintal' in df else 1
        mp = df['market_price_rs_per_quintal'].iloc[0] if 'market_price_rs_per_quintal' in df else msp
        df['msp_coverage_ratio'] = msp / mp if mp != 0 else 1
        df['yield_efficiency'] = 1.0
        df['area_intensity'] = 1.0
        area = df['area'].iloc[0] if 'area' in df else 1
        df['production_per_area'] = df['production'].iloc[0] / area if area != 0 else 0
        prod = df['production'].iloc[0] if 'production' in df else 1
        df['value_per_quintal_est'] = df.get('estimated_value_inr', pd.Series([0])).iloc[0] / prod if prod != 0 else 0
        ev_inr = df['estimated_value_inr'].iloc[0] if 'estimated_value_inr' in df else 1
        df['market_value_realization'] = df.get('estimated_value_market_inr', pd.Series([0])).iloc[0] / ev_inr if ev_inr != 0 else 1

        # State-level averages (use current values as proxy)
        for agg_col in ['market_price_rs_per_quintal', 'production', 'yield']:
            df[f'state_avg_{agg_col}'] = df[agg_col].iloc[0] if agg_col in df else 0

        return df

    def _predict_single(self, model_name: str, df: pd.DataFrame):
        """Make prediction using a specific model."""
        if model_name not in self.models:
            return None
        try:
            pipeline = self.pipelines[model_name]
            df_transformed = pipeline.transform(df)
            X = pipeline.get_features(df_transformed)
            prediction = self.models[model_name].predict(X)[0]
            return float(prediction)
        except Exception as e:
            print(f"   ⚠️ Prediction error ({model_name}): {e}")
            return None

    @staticmethod
    def _classify_demand(index):
        if index is None:
            return "Unknown"
        if index >= 75:
            return "Very High"
        elif index >= 50:
            return "High"
        elif index >= 25:
            return "Moderate"
        else:
            return "Low"

    @staticmethod
    def _generate_farmer_advisory(fair_price, market_price, msp, production):
        advisories = []
        if fair_price and market_price and msp:
            if market_price < msp:
                advisories.append(
                    "⚠️ ALERT: Expected market price is BELOW MSP. "
                    "Consider selling through government procurement channels (FCI/State agencies)."
                )
            elif market_price < fair_price:
                advisories.append(
                    "💡 Market price is below fair value. "
                    "Consider holding stock if storage is available or exploring direct-to-consumer channels."
                )
            else:
                advisories.append(
                    "✅ Market conditions are favorable. "
                    "Current market price meets or exceeds fair farmgate estimate."
                )

            margin = ((market_price - msp) / msp * 100) if msp > 0 else 0
            if margin > 50:
                advisories.append(
                    f"🔴 High intermediary margin detected ({margin:.1f}%). "
                    "Use FPO/cooperative channels to retain more value."
                )
        return advisories

    @staticmethod
    def _generate_buyer_advisory(market_price, demand_index, production, msp):
        advisories = []
        if demand_index and demand_index > 70:
            advisories.append(
                "📈 High demand detected. Expect competitive procurement environment. "
                "Consider advance contracts."
            )
        elif demand_index and demand_index < 30:
            advisories.append(
                "📉 Low demand signal. Favorable conditions for bulk procurement "
                "at competitive rates."
            )

        if market_price and msp and market_price > msp * 2:
            advisories.append(
                "⚠️ Market price significantly above MSP — possible supply constraint. "
                "Explore alternate sourcing regions."
            )

        return advisories


# =============================================================================
# ██████╗ CELL 13: TEST THE PREDICTION ENGINE
# =============================================================================

print(f"\n{'='*70}")
print(f"  🧪 TESTING PREDICTION ENGINE")
print(f"{'='*70}")

engine = AgriPredictionEngine(config.MODEL_OUTPUT_DIR)

# Test Case: Farmer Side
test_input = {
    'state': 'Uttar Pradesh',
    'district': 'Lucknow',
    'crop': 'Wheat',
    'year': 2017,
    'season': 'Rabi',
    'area': 5000,
    'production': 20000,
    'yield': 4.0,
    'msp_rs_per_quintal': 1625,
    'n_price_reports': 500,
    'estimated_value_inr': 32500000,
    'market_price_rs_per_quintal': 1750,
    'estimated_value_market_inr': 35000000,
}

print("\n  ── FARMER SIDE PREDICTION ──")
farmer_result = engine.predict_farmer_side(test_input)
print(json.dumps(farmer_result, indent=2, ensure_ascii=False))

print("\n  ── BUYER SIDE PREDICTION ──")
buyer_result = engine.predict_buyer_side(test_input)
print(json.dumps(buyer_result, indent=2, ensure_ascii=False))


# =============================================================================
# ██████╗ CELL 14: EXPORT METADATA FOR FRONTEND INTEGRATION
# =============================================================================

def export_integration_metadata(trainers: list, df: pd.DataFrame, output_dir: str):
    """Export metadata needed for frontend integration."""

    metadata = {
        'version': '1.0.0',
        'description': 'SIH26033 Dual-Sided Agri Price & Demand Prediction Engine',
        'models': {},
        'valid_inputs': {
            'states': sorted(df['state'].unique().tolist()),
            'crops': sorted(df['crop'].unique().tolist()),
            'seasons': sorted(df['season'].unique().tolist()),
            'year_range': {'min': int(df['year'].min()), 'max': int(df['year'].max()) + 5},
        },
        'endpoints': {
            'farmer_predict': '/api/v1/predict/farmer',
            'buyer_predict': '/api/v1/predict/buyer',
            'margin_check': '/api/v1/margin/check',
            'health': '/api/v1/health',
        },
    }

    for t in trainers:
        metadata['models'][t.name] = {
            'target': t.target_col,
            'model_type': t.model_type,
            'test_r2': round(t.metrics['test']['R2'], 4),
            'test_mae': round(t.metrics['test']['MAE'], 2),
            'cv_r2': round(t.metrics['cv_r2_mean'], 4),
            'top_features': t.feature_importance.head(10)['feature'].tolist(),
        }

    meta_path = os.path.join(output_dir, 'integration_metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"\n✅ Integration metadata saved → {meta_path}")
    return metadata

integration_meta = export_integration_metadata(all_trainers, df_feat, config.MODEL_OUTPUT_DIR)


# =============================================================================
# ██████╗ CELL 15: FASTAPI SERVER — COMPLETE API CODE
# =============================================================================

FASTAPI_CODE = '''#!/usr/bin/env python3
"""
================================================================================
  SIH26033 — FastAPI Prediction Server
  Agricultural Price & Demand Prediction API
================================================================================
  
  Run:
    uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload

  Docs:
    http://localhost:8000/docs  (Swagger UI)
    http://localhost:8000/redoc (ReDoc)
================================================================================
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import json
import os

# --- Import the prediction engine ---
# NOTE: Copy the AgriPredictionEngine class and its dependencies
#       or restructure as a package. For simplicity, we import from
#       the training script.
import sys
sys.path.insert(0, os.path.dirname(__file__))

# You'll need these imports in production:
import joblib
import numpy as np
import pandas as pd

# ──────────────────────────────────────────────
# Re-include the AgriPredictionEngine class here or import it.
# For production, refactor into a proper Python package:
#   agri_ml/
#     __init__.py
#     config.py
#     preprocessing.py
#     engine.py
#     api/
#       server.py
#       schemas.py
# ──────────────────────────────────────────────

# ═══════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════

class PredictionInput(BaseModel):
    """Input schema for prediction requests."""
    state: str = Field(..., description="State name", example="Uttar Pradesh")
    district: str = Field(..., description="District name", example="Lucknow")
    crop: str = Field(..., description="Crop name", example="Wheat")
    year: int = Field(..., description="Year", example=2025, ge=2012, le=2030)
    season: str = Field(..., description="Season", example="Rabi")
    area: float = Field(..., description="Area in hectares", example=5000, gt=0)
    production: Optional[float] = Field(None, description="Production in tonnes")
    yield_val: Optional[float] = Field(None, description="Yield in tonnes/hectare", alias="yield")
    msp_rs_per_quintal: float = Field(..., description="MSP in Rs per quintal", example=1625, gt=0)
    n_price_reports: Optional[float] = Field(None, description="Number of market price reports")
    market_price_rs_per_quintal: Optional[float] = Field(None, description="Known market price if available")
    estimated_value_inr: Optional[float] = Field(None, description="Estimated value in INR")
    estimated_value_market_inr: Optional[float] = Field(None, description="Estimated market value in INR")

    class Config:
        populate_by_name = True

class FarmerPredictionResponse(BaseModel):
    predictions: dict
    margin_analysis: dict
    advisory: List[str]

class BuyerPredictionResponse(BaseModel):
    predictions: dict
    market_intelligence: dict

class MarginCheckInput(BaseModel):
    msp: float = Field(..., gt=0)
    market_price: float = Field(..., gt=0)
    crop: str
    state: str

class MarginCheckResponse(BaseModel):
    margin_spread: float
    margin_pct: float
    is_excessive: bool
    is_below_msp: bool
    alert_level: str
    recommendation: str

class HealthResponse(BaseModel):
    status: str
    models_loaded: List[str]
    version: str


# ═══════════════════════════════════════════════
# APP INITIALIZATION
# ═══════════════════════════════════════════════

app = FastAPI(
    title="SIH26033 — Agri Price Prediction API",
    description=(
        "Dual-sided prediction engine for agricultural price discovery. "
        "Helps farmers get fair prices and buyers make informed procurement decisions. "
        "Built for Smart India Hackathon 2026 — Problem Statement SIH26033."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow all origins for hackathon (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the prediction engine at startup
MODEL_DIR = os.environ.get("MODEL_DIR", "./models")
engine = None  # Will be initialized on startup

@app.on_event("startup")
async def startup():
    global engine
    # Import and initialize the engine
    # In production, import from your package:
    from SIH26033_AgriPrice_DualSided_ML_Pipeline import AgriPredictionEngine
    engine = AgriPredictionEngine(MODEL_DIR)
    print(f"✅ Prediction engine loaded with {len(engine.models)} models")


# ═══════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════

@app.get("/api/v1/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Check API health and loaded models."""
    return HealthResponse(
        status="healthy" if engine else "not_ready",
        models_loaded=list(engine.models.keys()) if engine else [],
        version="1.0.0",
    )


@app.post("/api/v1/predict/farmer", response_model=FarmerPredictionResponse, tags=["Farmer"])
async def predict_farmer(input_data: PredictionInput):
    """
    **Farmer-Side Predictions**

    Returns:
    - Fair farmgate price per quintal
    - Expected production volume
    - Yield forecast
    - Intermediary margin analysis
    - Actionable advisory
    """
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not ready")

    input_dict = input_data.model_dump(by_alias=True)
    # Rename yield alias
    if 'yield' not in input_dict and 'yield_val' in input_dict:
        input_dict['yield'] = input_dict.pop('yield_val')

    result = engine.predict_farmer_side(input_dict)
    return FarmerPredictionResponse(**result)


@app.post("/api/v1/predict/buyer", response_model=BuyerPredictionResponse, tags=["Buyer"])
async def predict_buyer(input_data: PredictionInput):
    """
    **Buyer-Side Predictions**

    Returns:
    - Expected market procurement price
    - Demand proxy index (0-100)
    - Supply forecast
    - Market intelligence & advisory
    """
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not ready")

    input_dict = input_data.model_dump(by_alias=True)
    if 'yield' not in input_dict and 'yield_val' in input_dict:
        input_dict['yield'] = input_dict.pop('yield_val')

    result = engine.predict_buyer_side(input_dict)
    return BuyerPredictionResponse(**result)


@app.post("/api/v1/margin/check", response_model=MarginCheckResponse, tags=["Margin Analysis"])
async def check_margin(input_data: MarginCheckInput):
    """
    **Intermediary Margin Check**

    Quick check for margin exploitation between MSP and market price.
    """
    spread = input_data.market_price - input_data.msp
    pct = (spread / input_data.msp) * 100

    is_excessive = pct > 50
    is_below = spread < 0

    if is_below:
        alert = "CRITICAL"
        rec = (f"Market price for {input_data.crop} in {input_data.state} is BELOW MSP. "
               "Farmers should use government procurement channels.")
    elif is_excessive:
        alert = "WARNING"
        rec = (f"Excessive intermediary margin of {pct:.1f}% detected. "
               "Consider direct procurement or FPO channels to reduce costs.")
    elif pct > 25:
        alert = "MODERATE"
        rec = "Moderate intermediary margin. Monitor for price trends."
    else:
        alert = "NORMAL"
        rec = "Margins within acceptable range."

    return MarginCheckResponse(
        margin_spread=round(spread, 2),
        margin_pct=round(pct, 2),
        is_excessive=is_excessive,
        is_below_msp=is_below,
        alert_level=alert,
        recommendation=rec,
    )


@app.get("/api/v1/meta/crops", tags=["Metadata"])
async def get_supported_crops():
    """Get list of supported crops."""
    meta_path = os.path.join(MODEL_DIR, "integration_metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)
        return meta["valid_inputs"]
    return {"error": "Metadata not found"}


@app.get("/api/v1/meta/models", tags=["Metadata"])
async def get_model_info():
    """Get information about loaded models and their performance."""
    meta_path = os.path.join(MODEL_DIR, "integration_metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)
        return meta["models"]
    return {"error": "Metadata not found"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''

# Write the FastAPI server file
api_path = os.path.join(config.API_OUTPUT_DIR, "api_server.py")
with open(api_path, 'w') as f:
    f.write(FASTAPI_CODE)

print(f"\n✅ FastAPI server written → {api_path}")
print(f"   Run with: uvicorn api.api_server:app --host 0.0.0.0 --port 8000 --reload")


# =============================================================================
# ██████╗ CELL 16: REQUIREMENTS.TXT
# =============================================================================

REQUIREMENTS = """# SIH26033 — Agri Price Prediction Engine
# Production dependencies
pandas>=1.5.0
numpy>=1.23.0
scikit-learn>=1.2.0
xgboost>=1.7.0
lightgbm>=3.3.0
joblib>=1.2.0
matplotlib>=3.6.0
seaborn>=0.12.0
fastapi>=0.100.0
uvicorn>=0.23.0
pydantic>=2.0.0
python-multipart>=0.0.5
"""

req_path = "requirements.txt"
with open(req_path, 'w') as f:
    f.write(REQUIREMENTS)
print(f"✅ Requirements written → {req_path}")


# =============================================================================
# ██████╗ CELL 17: FINAL SUMMARY
# =============================================================================

print(f"""
{'='*70}
  ✅ SIH26033 — DUAL-SIDED PREDICTION ENGINE — COMPLETE
{'='*70}

  📁 Generated Files:
     ├── models/
     │   ├── farmer_fair_price_model.joblib
     │   ├── farmer_fair_price_pipeline.joblib
     │   ├── farmer_fair_price_meta.json
     │   ├── farmer_production_model.joblib
     │   ├── farmer_production_pipeline.joblib
     │   ├── farmer_production_meta.json
     │   ├── farmer_yield_model.joblib
     │   ├── farmer_yield_pipeline.joblib
     │   ├── farmer_yield_meta.json
     │   ├── buyer_market_price_model.joblib
     │   ├── buyer_market_price_pipeline.joblib
     │   ├── buyer_market_price_meta.json
     │   ├── buyer_demand_index_model.joblib
     │   ├── buyer_demand_index_pipeline.joblib
     │   ├── buyer_demand_index_meta.json
     │   ├── integration_metadata.json
     │   ├── eda_plots.png
     │   └── margin_analysis.png
     ├── api/
     │   └── api_server.py
     └── requirements.txt

  🚀 To deploy:
     1. pip install -r requirements.txt
     2. uvicorn api.api_server:app --host 0.0.0.0 --port 8000 --reload
     3. Visit http://localhost:8000/docs for Swagger UI

  🌐 API Endpoints:
     POST /api/v1/predict/farmer  — Farmer-side predictions
     POST /api/v1/predict/buyer   — Buyer-side predictions
     POST /api/v1/margin/check    — Intermediary margin check
     GET  /api/v1/health          — Health check
     GET  /api/v1/meta/crops      — Supported crops/states
     GET  /api/v1/meta/models     — Model performance info
{'='*70}
""")
