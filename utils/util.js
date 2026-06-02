// 格式化日期
const formatDate = (date) => {
  if (!date) return '';
  
  // 如果传入的是字符串，尝试转换为Date对象
  if (typeof date === 'string') {
    date = parseDate(date);
  }
  
  if (!(date instanceof Date) || isNaN(date.getTime())) return date;
  
  // 使用自定义格式，确保24小时制且包含秒
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 解析日期字符串，兼容iOS
 * @param {string} dateStr - 日期字符串，如"2025-06-13 17:08:13"
 * @returns {Date} - 返回Date对象
 */
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  
  // 已经是Date对象，直接返回
  if (dateStr instanceof Date) return dateStr;
  
  try {
    // 处理常见的日期格式
    if (typeof dateStr === 'string') {
      // 将横杠替换为斜杠，解决iOS兼容性问题
      const normalizedDateStr = dateStr.replace(/-/g, '/');
      
      // 尝试创建日期对象
      const date = new Date(normalizedDateStr);
      
      // 验证日期是否有效
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // 如果上面的方法失败，尝试手动解析
    if (typeof dateStr === 'string') {
      // 匹配 YYYY-MM-DD HH:MM:SS 或 YYYY/MM/DD HH:MM:SS 格式
      const regex = /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/;
      const parts = regex.exec(dateStr);
      
      if (parts) {
        // 月份是从0开始的
        const year = parseInt(parts[1], 10);
        const month = parseInt(parts[2], 10) - 1;
        const day = parseInt(parts[3], 10);
        const hour = parts[4] ? parseInt(parts[4], 10) : 0;
        const minute = parts[5] ? parseInt(parts[5], 10) : 0;
        const second = parts[6] ? parseInt(parts[6], 10) : 0;
        
        return new Date(year, month, day, hour, minute, second);
      }
    }
  } catch (e) {
    console.error('日期解析错误:', e);
  }
  
  // 如果所有方法都失败，返回当前日期
  return new Date();
};

module.exports = {
  formatDate,
  parseDate
}; 