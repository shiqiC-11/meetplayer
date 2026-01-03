// level.js - 等级相关工具函数

import { LEVEL_MAPPING, SIMPLE_LEVELS, NTRP_LEVELS } from './constants.js';

/**
 * 简化等级转 NTRP 范围
 * @param {string} simpleLevel
 * @returns {{ntrpMin: number, ntrpMax: number}}
 */
export function simpleLevelToNTRP(simpleLevel) {
  return LEVEL_MAPPING[simpleLevel] || { ntrpMin: 1.0, ntrpMax: 7.0 };
}

/**
 * NTRP 转简化等级
 * @param {number} ntrp
 * @returns {string}
 */
export function ntrpToSimpleLevel(ntrp) {
  for (const [level, range] of Object.entries(LEVEL_MAPPING)) {
    if (ntrp >= range.ntrpMin && ntrp <= range.ntrpMax) {
      return level;
    }
  }
  return '中级'; // 默认返回中级
}

/**
 * 检查用户等级是否匹配 Slot 要求
 * @param {object} userLevel - { simple, ntrp }
 * @param {object} requirement - { simpleLevel, ntrpMin, ntrpMax }
 * @returns {boolean}
 */
export function checkLevelMatch(userLevel, requirement) {
  // 策略 1：精确匹配（优先）
  if (userLevel.ntrp && requirement.ntrpMin && requirement.ntrpMax) {
    return userLevel.ntrp >= requirement.ntrpMin &&
           userLevel.ntrp <= requirement.ntrpMax;
  }

  // 策略 2：简化等级匹配
  if (userLevel.simple && requirement.simpleLevel) {
    if (Array.isArray(requirement.simpleLevel)) {
      return requirement.simpleLevel.includes(userLevel.simple);
    }
    return userLevel.simple === requirement.simpleLevel;
  }

  // 策略 3：NTRP 转简化等级匹配
  if (userLevel.ntrp && requirement.simpleLevel) {
    const userSimpleLevel = ntrpToSimpleLevel(userLevel.ntrp);
    if (Array.isArray(requirement.simpleLevel)) {
      return requirement.simpleLevel.includes(userSimpleLevel);
    }
    return userSimpleLevel === requirement.simpleLevel;
  }

  // 默认不匹配
  return false;
}

/**
 * 获取等级描述
 * @param {string} simpleLevel
 * @returns {string}
 */
export function getLevelDescription(simpleLevel) {
  const mapping = LEVEL_MAPPING[simpleLevel];
  return mapping ? mapping.description : '';
}

/**
 * 获取等级示例
 * @param {string} simpleLevel
 * @returns {string}
 */
export function getLevelExample(simpleLevel) {
  const mapping = LEVEL_MAPPING[simpleLevel];
  return mapping ? mapping.example : '';
}

/**
 * 格式化等级显示
 * @param {object} level - { simple, ntrp, verified }
 * @returns {string}
 */
export function formatLevelDisplay(level) {
  if (!level) return '';

  let display = level.simple || '未设置';

  if (level.ntrp) {
    display += ` (NTRP ${level.ntrp})`;
  }

  if (level.verified) {
    display += ' ✅';
  }

  return display;
}

/**
 * 格式化等级要求显示
 * @param {object} requirement - { simpleLevel, ntrpMin, ntrpMax }
 * @returns {string}
 */
export function formatRequirementDisplay(requirement) {
  if (!requirement) return '不限';

  // 如果有 NTRP 范围
  if (requirement.ntrpMin && requirement.ntrpMax) {
    const simpleLevels = [];
    if (Array.isArray(requirement.simpleLevel)) {
      simpleLevels.push(...requirement.simpleLevel);
    } else if (requirement.simpleLevel) {
      simpleLevels.push(requirement.simpleLevel);
    }

    if (simpleLevels.length > 0) {
      return `${simpleLevels.join('、')} (NTRP ${requirement.ntrpMin}-${requirement.ntrpMax})`;
    }
    return `NTRP ${requirement.ntrpMin}-${requirement.ntrpMax}`;
  }

  // 只有简化等级
  if (requirement.simpleLevel) {
    if (Array.isArray(requirement.simpleLevel)) {
      return requirement.simpleLevel.join('、');
    }
    return requirement.simpleLevel;
  }

  return '不限';
}

/**
 * 扩展查询范围（弹性匹配）
 * @param {number} ntrp
 * @param {number} tolerance - 容忍度（默认 0.5）
 * @returns {{min: number, max: number}}
 */
export function expandNTRPRange(ntrp, tolerance = 0.5) {
  return {
    min: Math.max(1.0, ntrp - tolerance),
    max: Math.min(7.0, ntrp + tolerance)
  };
}

/**
 * 获取匹配度
 * @param {object} userLevel - { simple, ntrp }
 * @param {object} requirement - { simpleLevel, ntrpMin, ntrpMax }
 * @returns {number} 0-100
 */
export function getMatchScore(userLevel, requirement) {
  // 精确 NTRP 匹配
  if (userLevel.ntrp && requirement.ntrpMin && requirement.ntrpMax) {
    if (userLevel.ntrp >= requirement.ntrpMin &&
        userLevel.ntrp <= requirement.ntrpMax) {
      return 100; // 完美匹配
    }

    // 接近但不在范围内
    const avgRequired = (requirement.ntrpMin + requirement.ntrpMax) / 2;
    const diff = Math.abs(userLevel.ntrp - avgRequired);

    if (diff <= 0.5) {
      return 80; // 接近匹配
    } else if (diff <= 1.0) {
      return 50; // 可能匹配
    }
    return 0; // 不匹配
  }

  // 简化等级匹配
  if (userLevel.simple && requirement.simpleLevel) {
    const simpleLevels = Array.isArray(requirement.simpleLevel)
      ? requirement.simpleLevel
      : [requirement.simpleLevel];

    if (simpleLevels.includes(userLevel.simple)) {
      return 80; // 基本匹配
    }
  }

  return 0;
}
