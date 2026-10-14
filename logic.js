/**
 * ============================================================================
 * MÁY TÍNH TIỆN LỢI - HỆ THỐNG XỬ LÝ TOÁN HỌC & TƯƠNG TÁC CẬN HIỆN ĐẠI
 * ============================================================================
 * 
 * Tính năng chính:
 * 1. Phân tích cú pháp toán học chuẩn xác (BODMAS/PEMDAS) không dùng eval().
 * 2. Hỗ trợ số mũ xʸ, căn bậc hai √, giai thừa n!, phần trăm %, dấu ngoặc (...).
 * 3. Chuyển đổi linh hoạt giữa Phân số tối giản và Số thập phân (S⇔D).
 * 4. Phát hiện lỗi cú pháp, hiển thị chính xác vị trí ký tự bị sai để dễ sửa.
 * 5. Xử lý phép tính lớn (BigInt), phát hiện vượt ngưỡng an toàn và thông báo chuẩn:
 *    "Quá khả năng tính của tooi ròiii :(( \n Mong bạn thông cảm !"
 * 6. Tích hợp Web Audio API phát tần số xoa dịu (~432Hz/528Hz) khi gõ phím.
 * 7. Lịch sử tính toán, bộ 4 Theme tối hiện đại bảo vệ mắt, phím tắt laptop đầy đủ.
 */

// ============================================================================
// 1. MODULE ÂM THANH XOA DỊU (CALMING WEB AUDIO SYNTHESIZER)
// ============================================================================
const SoundEngine = (() => {
  let audioCtx = null;
  let isSoundEnabled = true;
  let soundTone = 'soothing'; // 'soothing' | 'water' | 'bubble'

  // Thang âm ngũ cung dịu tai (Pentatonic frequency map - tạo cảm giác thư thái)
  const PENTATONIC_SCALE = {
    '0': 261.63, // C4
    '1': 293.66, // D4
    '2': 329.63, // E4
    '3': 392.00, // G4
    '4': 440.00, // A4
    '5': 523.25, // C5
    '6': 587.33, // D5
    '7': 659.25, // E5
    '8': 783.99, // G5
    '9': 880.00, // A5
    '.': 493.88, // B4
    '+': 349.23, // F4
    '-': 329.63, // E4
    '×': 415.30,
    '÷': 466.16,
    '=': 528.00, // Tần số phục hồi & thư giãn 528Hz
    'ac': 220.00,
    'del': 246.94,
    'fn': 659.25
  };

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playKeySound(keyChar = '0', type = 'num') {
    if (!isSoundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      let freq = PENTATONIC_SCALE[keyChar] || 432.0;

      if (soundTone === 'soothing') {
        // Tần số dịu nhẹ như tiếng Marimba / Chuông gỗ thiền
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.085);
      } else if (soundTone === 'water') {
        // Tiếng giọt nước thanh khiết
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.9, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.04);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.065);
      } else {
        // Tiếng gõ phím cơ êm ái (Soft Thud)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * 0.4, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.2, now + 0.035);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.055);
      }
    } catch (e) {
      // Bỏ qua nếu trình duyệt chặn âm thanh tự động
    }
  }

  function playSuccessChord() {
    if (!isSoundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      // Hợp âm nhẹ 528Hz khi ra kết quả
      [528, 660].forEach((f, idx) => {
        const now = audioCtx.currentTime + idx * 0.02;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      });
    } catch (e) {}
  }

  return {
    playKeySound,
    playSuccessChord,
    setEnabled: (val) => { isSoundEnabled = val; },
    getEnabled: () => isSoundEnabled,
    setTone: (tone) => { soundTone = tone; },
    getTone: () => soundTone
  };
})();

// ============================================================================
// 2. MODULE CHUYỂN ĐỔI PHÂN SỐ CHÍNH XÁC (FRACTION CONVERTER)
// ============================================================================
const FractionEngine = (() => {
  /**
   * Chuyển đổi số thực thập phân thành phân số tối giản (Continued Fractions Algorithm)
   * Trả về { numerator, denominator, formatted } hoặc null nếu không thể quy đổi
   */
  function toFraction(val, maxDenominator = 100000, tolerance = 1e-9) {
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return null;

    const sign = val < 0 ? -1 : 1;
    val = Math.abs(val);

    // Nếu là số nguyên
    if (Math.abs(val - Math.round(val)) < tolerance) {
      return {
        numerator: sign * Math.round(val),
        denominator: 1,
        isWhole: true,
        formatted: `${sign * Math.round(val)}`
      };
    }

    // Thuật toán liên phân số
    let h1 = 1, h2 = 0;
    let k1 = 0, k2 = 1;
    let b = val;

    for (let iter = 0; iter < 60; iter++) {
      let a = Math.floor(b);
      let auxH = h1;
      h1 = a * h1 + h2;
      h2 = auxH;

      let auxK = k1;
      k1 = a * k1 + k2;
      k2 = auxK;

      if (k1 > maxDenominator) break;

      let diff = Math.abs(val - h1 / k1);
      if (diff <= tolerance || diff <= val * 1e-7) {
        return {
          numerator: sign * h1,
          denominator: k1,
          isWhole: k1 === 1,
          formatted: `${sign * h1}/${k1}`
        };
      }

      let remainder = b - a;
      if (Math.abs(remainder) < 1e-12) break;
      b = 1 / remainder;
    }

    // Nếu k1 nhỏ và sai số rất bé
    if (k1 <= maxDenominator && Math.abs(val - h1 / k1) <= 1e-5) {
      return {
        numerator: sign * h1,
        denominator: k1,
        isWhole: k1 === 1,
        formatted: `${sign * h1}/${k1}`
      };
    }

    return null;
  }

  return { toFraction };
})();

// ============================================================================
// 3. BỘ PHÂN TÍCH VÀ TÍNH TOÁN TOÁN HỌC (HIGH-PRECISION MATH PARSER)
// ============================================================================
const MathEngine = (() => {
  // Thông báo lỗi chuẩn theo yêu cầu khi vượt quá khả năng tính
  const OVERLOAD_MESSAGE = "Quá khả năng tính của tooi ròiii :(( \nMong bạn thông cảm !";

  /**
   * Tính giai thừa chính xác cao với BigInt cho n nguyên không âm
   */
  function computeFactorial(n) {
    if (n < 0 || !Number.isInteger(n)) {
      throw { message: "Giai thừa chỉ áp dụng cho số nguyên không âm", pos: -1 };
    }
    // Nếu n quá lớn (> 1000) vượt ngưỡng xử lý an toàn
    if (n > 1000) {
      throw { isOverload: true, message: OVERLOAD_MESSAGE };
    }
    if (n === 0 || n === 1) return 1;

    if (n <= 170) {
      let res = 1;
      for (let i = 2; i <= n; i++) res *= i;
      return res;
    }

    // Sử dụng BigInt cho 170 < n <= 1000
    let bigRes = 1n;
    for (let i = 2n; i <= BigInt(n); i++) {
      bigRes *= i;
    }
    return bigRes.toString();
  }

  /**
   * Tính lũy thừa an toàn
   */
  function computePower(base, exponent) {
    // Kiểm tra tràn lũy thừa vô lý (ví dụ: 10^100000)
    if (Math.abs(exponent) > 10000 || (Math.abs(base) > 1 && exponent > 5000)) {
      throw { isOverload: true, message: OVERLOAD_MESSAGE };
    }
    if (base === 0 && exponent < 0) {
      throw { message: "Không thể chia cho số 0 (0 lũy thừa âm)", pos: -1 };
    }
    const res = Math.pow(base, exponent);
    if (!isFinite(res)) {
      throw { isOverload: true, message: OVERLOAD_MESSAGE };
    }
    return res;
  }

  /**
   * Xử lý làm tròn tránh lỗi dấu phẩy động 0.1 + 0.2 = 0.30000000000000004
   */
  function fixPrecision(num) {
    if (typeof num === 'string') return num; // Kết quả chuỗi BigInt
    if (!isFinite(num)) return num;
    const factor = 1e12;
    const rounded = Math.round((num + Number.EPSILON) * factor) / factor;
    if (Math.abs(rounded - Math.round(rounded)) < 1e-11) {
      return Math.round(rounded);
    }
    return rounded;
  }

  /**
   * Bộ tách từ vựng (Tokenizer) ghi nhận vị trí từng ký tự trong chuỗi gốc
   */
  function tokenize(exprStr, ansValue = 0) {
    const tokens = [];
    let i = 0;
    const len = exprStr.length;

    while (i < len) {
      const char = exprStr[i];

      // Bỏ qua khoảng trắng
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Nhận diện 'Ans'
      if (exprStr.substr(i, 3) === 'Ans') {
        tokens.push({
          type: 'NUMBER',
          value: ansValue,
          raw: 'Ans',
          start: i,
          end: i + 3
        });
        i += 3;
        continue;
      }

      // Nhận diện Số (nguyên hoặc thập phân)
      if (/[0-9]/.test(char) || (char === '.' && (i + 1 < len && /[0-9]/.test(exprStr[i + 1])))) {
        let start = i;
        let numStr = '';
        let dotCount = 0;

        while (i < len && (/[0-9]/.test(exprStr[i]) || exprStr[i] === '.')) {
          if (exprStr[i] === '.') {
            dotCount++;
            if (dotCount > 1) {
              throw { message: "Số không thể có nhiều hơn một dấu chấm thập phân", pos: i };
            }
          }
          numStr += exprStr[i];
          i++;
        }

        tokens.push({
          type: 'NUMBER',
          value: parseFloat(numStr),
          raw: numStr,
          start: start,
          end: i
        });
        continue;
      }

      // Các toán tử và ký hiệu đặc biệt
      if (['+', '-', '−', '×', '*', '÷', '/', '^', '√', '!', '%', '(', ')'].includes(char)) {
        let normType = char;
        if (char === '−') normType = '-';
        if (char === '*') normType = '×';
        if (char === '/') normType = '÷';

        tokens.push({
          type: 'OP',
          value: normType,
          raw: char,
          start: i,
          end: i + 1
        });
        i++;
        continue;
      }

      // Ký tự không hợp lệ
      throw { message: `Ký tự '${char}' không hợp lệ trong phép tính`, pos: i };
    }

    return tokens;
  }

  /**
   * Thêm phép nhân ngầm (Implicit Multiplication) như máy tính Casio
   * Ví dụ: 2(3) -> 2 × (3); (2)(3) -> (2) × (3); 5√9 -> 5 × √9; 2Ans -> 2 × Ans
   */
  function insertImplicitMultiplications(tokens) {
    const output = [];
    for (let i = 0; i < tokens.length; i++) {
      const cur = tokens[i];
      output.push(cur);

      if (i + 1 < tokens.length) {
        const next = tokens[i + 1];

        const isCurOperand = cur.type === 'NUMBER' || (cur.type === 'OP' && (cur.value === ')' || cur.value === '!' || cur.value === '%'));
        const isNextOperand = next.type === 'NUMBER' || (next.type === 'OP' && (next.value === '(' || next.value === '√'));

        if (isCurOperand && isNextOperand) {
          output.push({
            type: 'OP',
            value: '×',
            raw: '×',
            start: cur.end,
            end: next.start,
            implicit: true
          });
        }
      }
    }
    return output;
  }

  /**
   * Parser đệ quy chuẩn xác (Recursive Descent Parser) theo đúng thứ tự ưu tiên
   */
  class Parser {
    constructor(tokens) {
      this.tokens = tokens;
      this.cursor = 0;
    }

    peek() {
      return this.tokens[this.cursor] || null;
    }

    consume() {
      return this.tokens[this.cursor++] || null;
    }

    parse() {
      if (this.tokens.length === 0) {
        return 0;
      }

      const res = this.parseExpression();

      if (this.cursor < this.tokens.length) {
        const extra = this.tokens[this.cursor];
        throw { message: `Cú pháp thừa thãi hoặc thiếu toán tử trước '${extra.raw}'`, pos: extra.start };
      }

      return res;
    }

    // Thứ tự 1: Cộng & Trừ (+, -)
    parseExpression() {
      let left = this.parseTerm();

      while (this.peek() && (this.peek().value === '+' || this.peek().value === '-')) {
        const op = this.consume();
        const right = this.parseTerm();
        if (typeof left === 'string' || typeof right === 'string') {
          throw { isOverload: true, message: OVERLOAD_MESSAGE };
        }
        if (op.value === '+') left = left + right;
        else left = left - right;
        left = fixPrecision(left);
      }

      return left;
    }

    // Thứ tự 2: Nhân & Chia (×, ÷)
    parseTerm() {
      let left = this.parsePower();

      while (this.peek() && (this.peek().value === '×' || this.peek().value === '÷')) {
        const op = this.consume();
        const right = this.parsePower();

        if (typeof left === 'string' || typeof right === 'string') {
          throw { isOverload: true, message: OVERLOAD_MESSAGE };
        }

        if (op.value === '×') {
          left = left * right;
        } else {
          if (Math.abs(right) < 1e-15) {
            throw { message: "Không thể chia cho số 0", pos: op.start };
          }
          left = left / right;
        }
        left = fixPrecision(left);
      }

      return left;
    }

    // Thứ tự 3: Lũy thừa (^) - Right Associative
    parsePower() {
      let base = this.parseUnary();

      if (this.peek() && this.peek().value === '^') {
        const op = this.consume();
        const exponent = this.parsePower(); // Đệ quy phải
        return computePower(base, exponent);
      }

      return base;
    }

    // Thứ tự 4: Toán tử một ngôi (Unary: +, -, √)
    parseUnary() {
      const tok = this.peek();
      if (!tok) {
        throw { message: "Biểu thức kết thúc bất ngờ, thiếu toán tử hoặc số", pos: -1 };
      }

      if (tok.value === '+') {
        this.consume();
        return this.parseUnary();
      }
      if (tok.value === '-') {
        this.consume();
        const val = this.parseUnary();
        return -val;
      }
      if (tok.value === '√') {
        const sqrtOp = this.consume();
        const val = this.parseUnary();
        if (val < 0) {
          throw { message: "Không thể lấy căn bậc hai của số âm", pos: sqrtOp.start };
        }
        return fixPrecision(Math.sqrt(val));
      }

      return this.parsePostfix();
    }

    // Thứ tự 5: Hậu tố (! giai thừa, % phần trăm)
    parsePostfix() {
      let primary = this.parsePrimary();

      while (this.peek() && (this.peek().value === '!' || this.peek().value === '%')) {
        const op = this.consume();
        if (op.value === '!') {
          primary = computeFactorial(primary);
        } else if (op.value === '%') {
          if (typeof primary === 'string') {
            throw { isOverload: true, message: OVERLOAD_MESSAGE };
          }
          primary = primary / 100;
          primary = fixPrecision(primary);
        }
      }

      return primary;
    }

    // Thứ tự 6: Phần tử cơ bản (Số, Ans, Dấu ngoặc)
    parsePrimary() {
      const tok = this.consume();
      if (!tok) {
        throw { message: "Biểu thức chưa hoàn tất, thiếu toán hạng", pos: -1 };
      }

      if (tok.type === 'NUMBER') {
        return tok.value;
      }

      if (tok.value === '(') {
        const inner = this.parseExpression();
        const closing = this.consume();
        if (!closing || closing.value !== ')') {
          throw { message: "Dấu ngoặc mở '(' không có ngoặc đóng tương ứng", pos: tok.start };
        }
        return inner;
      }

      if (tok.value === ')') {
        throw { message: "Dấu ngoặc đóng ')' thừa hoặc đặt không đúng chỗ", pos: tok.start };
      }

      throw { message: `Toán tử '${tok.raw}' đặt sai vị trí hoặc thiếu toán hạng trước đó`, pos: tok.start };
    }
  }

  /**
   * Tính toán toàn diện biểu thức và trả về kết quả
   */
  function evaluate(exprStr, ansValue = 0) {
    if (!exprStr || exprStr.trim() === '') {
      return { result: 0, fraction: null, isOverload: false };
    }

    try {
      const rawTokens = tokenize(exprStr, ansValue);
      const tokens = insertImplicitMultiplications(rawTokens);
      const parser = new Parser(tokens);
      const result = parser.parse();

      let fraction = null;
      if (typeof result === 'number') {
        fraction = FractionEngine.toFraction(result);
      }

      return {
        success: true,
        result: result,
        fraction: fraction,
        isOverload: false
      };
    } catch (err) {
      if (err.isOverload) {
        return {
          success: false,
          isOverload: true,
          message: OVERLOAD_MESSAGE,
          pos: err.pos || -1
        };
      }
      return {
        success: false,
        isOverload: false,
        message: err.message || "Lỗi cú pháp biểu thức",
        pos: err.pos !== undefined ? err.pos : -1
      };
    }
  }

  return { evaluate, OVERLOAD_MESSAGE };
})();

// ============================================================================
// 4. BỘ QUẢN LÝ GIAO DIỆN & TƯƠNG TÁC (UI CONTROLLER)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const menuToggleBtn = document.getElementById('menu-toggle-btn');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const sideDrawer = document.getElementById('side-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerTabs = document.querySelectorAll('.drawer-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  const charStream = document.getElementById('char-stream');
  const previewResult = document.getElementById('preview-result');
  const primaryResult = document.getElementById('primary-result');
  const fractionSubview = document.getElementById('fraction-subview');
  const fractionValue = document.getElementById('fraction-value');
  const formatToggleBtn = document.getElementById('format-toggle-btn');
  const currentFormatLabel = document.getElementById('current-format-label');
  const toggleFractionQuick = document.getElementById('toggle-fraction-quick');

  const ansIndicator = document.getElementById('ans-indicator');
  const ansValueTag = document.getElementById('ans-value-tag');

  const errorBanner = document.getElementById('error-banner');
  const errorTitle = document.getElementById('error-title');
  const errorMessage = document.getElementById('error-message');
  const errorLocationTag = document.getElementById('error-location-tag');

  const historyList = document.getElementById('history-list');
  const historyCount = document.getElementById('history-count');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  const soundToggle = document.getElementById('sound-toggle');
  const soundToneSelect = document.getElementById('sound-tone-select');
  const splashScreen = document.getElementById('splash-screen');

  const themeCards = document.querySelectorAll('.theme-card');

  // Quản lý màn hình chào Splash Screen TMK calculator (1.5s mở dần)
  let splashDismissed = false;
  function dismissSplash() {
    if (splashDismissed || !splashScreen) return;
    splashDismissed = true;
    splashScreen.classList.add('splash-fade-out');
    setTimeout(() => {
      SoundEngine.playSuccessChord();
      splashScreen.style.display = 'none';
    }, 550);
  }

  if (splashScreen) {
    // Tự động tắt sau khi hoàn thành 1.5s mở chữ + 0.35s hiển thị trọn vẹn
    setTimeout(dismissSplash, 1850);
    splashScreen.addEventListener('click', dismissSplash);
    window.addEventListener('keydown', () => {
      if (!splashDismissed) dismissSplash();
    }, { once: true });
  }

  

  // Trạng thái ứng dụng (Application State)
  const state = {
    expression: '',            // Chuỗi biểu thức hiện tại
    lastResult: 0,             // Kết quả phép tính vừa xong
    ansValue: 0,               // Giá trị Ans đã lưu
    displayFormat: 'fraction', // 'fraction' | 'decimal'
    errorPos: -1,              // Vị trí lỗi ký tự (-1 nếu không có lỗi)
    isCalculated: false,       // Đã bấm dấu = chưa
    history: []                // Mảng lịch sử tính toán
  };

  // Khôi phục cài đặt từ localStorage
  function loadPersistedState() {
    const savedTheme = localStorage.getItem('calculator_theme') || 'cyber-dark';
    body.setAttribute('data-theme', savedTheme);
    themeCards.forEach(card => {
      const radio = card.querySelector('input');
      const isCurrent = card.dataset.theme === savedTheme;
      card.classList.toggle('active', isCurrent);
      if (radio) radio.checked = isCurrent;
    });

    const savedSound = localStorage.getItem('calculator_sound');
    const isSoundOn = savedSound !== 'false';
    soundToggle.checked = isSoundOn;
    SoundEngine.setEnabled(isSoundOn);

    const savedTone = localStorage.getItem('calculator_tone') || 'soothing';
    soundToneSelect.value = savedTone;
    SoundEngine.setTone(savedTone);

    try {
      const savedHist = localStorage.getItem('calculator_history');
      if (savedHist) {
        state.history = JSON.parse(savedHist);
        renderHistory();
      }
    } catch (e) {}
  }

  function saveHistoryToStorage() {
    try {
      localStorage.setItem('calculator_history', JSON.stringify(state.history.slice(0, 50)));
    } catch (e) {}
  }

  // ============================================================================
  // RENDER MÀN HÌNH MÁY TÍNH
  // ============================================================================
  function renderExpression() {
    charStream.innerHTML = '';

    if (!state.expression) {
      charStream.innerHTML = '<span class="cursor"></span>';
      return;
    }

    // Hiển thị từng ký tự và đánh dấu vị trí lỗi nếu có
    for (let i = 0; i < state.expression.length; i++) {
      const char = state.expression[i];
      const span = document.createElement('span');
      span.className = 'expr-char';

      if (['+', '-', '−', '×', '÷', '^', '√', '!', '%'].includes(char)) {
        span.classList.add('op-glyph');
      }

      if (state.errorPos === i) {
        span.classList.add('error-highlight');
      }

      span.textContent = char;
      charStream.appendChild(span);
    }

    // Con trỏ nhấp nháy ở cuối
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    charStream.appendChild(cursor);

    // Cuộn ngang tự động tới cuối biểu thức
    const wrapper = charStream.parentElement.parentElement;
    wrapper.scrollLeft = wrapper.scrollWidth;
  }

  function updateLivePreview() {
    if (!state.expression || state.isCalculated) {
      previewResult.textContent = '';
      previewResult.classList.remove('has-val');
      return;
    }

    const evalRes = MathEngine.evaluate(state.expression, state.ansValue);
    if (evalRes.success && typeof evalRes.result === 'number') {
      const formatted = formatNumber(evalRes.result);
      previewResult.textContent = formatted;
      previewResult.classList.add('has-val');
    } else {
      previewResult.textContent = '';
      previewResult.classList.remove('has-val');
    }
  }

  function formatNumber(num) {
    if (typeof num === 'string') return num;
    if (Math.abs(num) > 1e14 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return num.toExponential(6).replace('e+', 'e');
    }
    return num.toLocaleString('en-US', { maximumFractionDigits: 10 });
  }

  function hideError() {
    state.errorPos = -1;
    errorBanner.classList.add('hidden');
    errorBanner.classList.remove('overload');
  }

  function showError(msg, pos = -1, isOverload = false) {
    state.errorPos = pos;
    renderExpression();

    if (isOverload) {
      errorTitle.textContent = "Thông Báo Quá Tải";
      errorMessage.textContent = msg;
      errorLocationTag.textContent = "";
      errorBanner.classList.add('overload');
    } else {
      errorTitle.textContent = "Lỗi Cú Pháp Toán Học";
      errorMessage.textContent = msg;
      if (pos >= 0) {
        errorLocationTag.textContent = `Vị trí sai: Ký tự số ${pos + 1} ('${state.expression[pos] || 'kết thúc'}')`;
      } else {
        errorLocationTag.textContent = "Hãy kiểm tra lại các phép toán đã nhập";
      }
      errorBanner.classList.remove('overload');
    }

    errorBanner.classList.remove('hidden');
  }

  // ============================================================================
  // CÁC THAO TÁC NHẬP DỮ LIỆU (USER ACTIONS)
  // ============================================================================
  function appendText(text) {
    hideError();

    // Nếu vừa tính xong mà bấm số hoặc Ans -> reset bắt đầu biểu thức mới
    if (state.isCalculated) {
      if (['+', '-', '−', '×', '÷', '^', '%', '!'].includes(text)) {
        // Tiếp tục phép tính với kết quả cũ
        state.expression = 'Ans' + text;
      } else {
        state.expression = text;
      }
      state.isCalculated = false;
    } else {
      state.expression += text;
    }

    renderExpression();
    updateLivePreview();
  }

  function handleBackspace() {
    hideError();
    if (state.isCalculated) {
      state.expression = '';
      state.isCalculated = false;
      primaryResult.textContent = '0';
      fractionSubview.classList.add('hidden');
      renderExpression();
      updateLivePreview();
      return;
    }

    if (state.expression.length > 0) {
      // Xóa Ans nguyên khối nếu ở cuối
      if (state.expression.endsWith('Ans')) {
        state.expression = state.expression.slice(0, -3);
      } else {
        state.expression = state.expression.slice(0, -1);
      }
      renderExpression();
      updateLivePreview();
    }
  }

  function handleClearAll() {
    hideError();
    state.expression = '';
    state.isCalculated = false;
    primaryResult.textContent = '0';
    fractionSubview.classList.add('hidden');
    previewResult.textContent = '';
    renderExpression();
  }

  function handleCalculate() {
    hideError();
    if (!state.expression || state.expression.trim() === '') {
      return;
    }

    const evalRes = MathEngine.evaluate(state.expression, state.ansValue);

    if (evalRes.success) {
      state.isCalculated = true;
      state.lastResult = evalRes.result;
      state.lastFraction = evalRes.fraction;

      // Cập nhật Ans
      if (typeof evalRes.result === 'number') {
        state.ansValue = evalRes.result;
        ansValueTag.textContent = formatNumber(evalRes.result);
        ansIndicator.classList.remove('hidden');
      }

      // Render kết quả
      updateResultDisplay();
      primaryResult.classList.remove('result-evaluated');
      void primaryResult.offsetWidth; // Trigger reflow animation
      primaryResult.classList.add('result-evaluated');

      previewResult.textContent = '';

      // Phát âm thanh hoàn thành
      SoundEngine.playSuccessChord();

      // Lưu vào lịch sử
      addToHistory(state.expression, evalRes.result, evalRes.fraction);
    } else {
      if (evalRes.isOverload) {
        showError(evalRes.message, -1, true);
        primaryResult.textContent = "Quá tải";
      } else {
        showError(evalRes.message, evalRes.pos, false);
      }
    }
  }

  function updateResultDisplay() {
    if (state.lastResult === null || state.lastResult === undefined) return;

    const formattedNum = formatNumber(state.lastResult);
    const frac = state.lastFraction;

    if (frac && !frac.isWhole) {
      fractionSubview.classList.remove('hidden');

      if (state.displayFormat === 'fraction') {
        primaryResult.textContent = frac.formatted;
        fractionValue.textContent = formattedNum;
        currentFormatLabel.textContent = "Phân số";
      } else {
        primaryResult.textContent = formattedNum;
        fractionValue.textContent = frac.formatted;
        currentFormatLabel.textContent = "Thập phân";
      }
    } else {
      primaryResult.textContent = formattedNum;
      fractionSubview.classList.add('hidden');
      currentFormatLabel.textContent = "Tiêu chuẩn";
    }
  }

  function toggleDisplayFormat() {
    state.displayFormat = state.displayFormat === 'fraction' ? 'decimal' : 'fraction';
    updateResultDisplay();
  }

  // ============================================================================
  // LỊCH SỬ TÍNH TOÁN (HISTORY MODULE)
  // ============================================================================
  function addToHistory(expr, result, fraction) {
    const item = {
      id: Date.now(),
      expr: expr,
      result: result,
      fraction: fraction ? fraction.formatted : null,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    state.history.unshift(item);
    if (state.history.length > 50) state.history.pop();
    saveHistoryToStorage();
    renderHistory();
  }

  function renderHistory() {
    historyCount.textContent = `${state.history.length} phép tính`;

    if (state.history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" fill="none" stroke-width="1.5">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7v5l3 3"/>
          </svg>
          <p>Chưa có lịch sử tính toán nào</p>
          <small>Các phép tính sau khi bấm = sẽ lưu tại đây</small>
        </div>`;
      return;
    }

    historyList.innerHTML = '';
    state.history.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-item';
      card.innerHTML = `
        <div class="hist-time">${item.time}</div>
        <div class="hist-expr">${item.expr}</div>
        <div class="hist-res">${item.fraction ? `${item.fraction} ≈ ` : ''}${formatNumber(item.result)}</div>
      `;

      card.addEventListener('click', () => {
        // Tái sử dụng biểu thức từ lịch sử
        state.expression = item.expr;
        state.isCalculated = false;
        renderExpression();
        updateLivePreview();
        closeDrawer();
      });

      historyList.appendChild(card);
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    saveHistoryToStorage();
    renderHistory();
  });

  // ============================================================================
  // XỬ LÝ SỰ KIỆN GÕ PHÍM & BÀN PHÍM CỨNG (PHYSICAL & VIRTUAL KEYBOARD)
  // ============================================================================
  const keypad = document.getElementById('calc-keypad');

  keypad.addEventListener('click', (e) => {
    const keyBtn = e.target.closest('.calc-key');
    if (!keyBtn) return;

    const action = keyBtn.dataset.action;
    const value = keyBtn.dataset.value;
    const soundKey = keyBtn.dataset.key || value || '0';

    // Âm thanh nhẹ nhàng
    SoundEngine.playKeySound(soundKey, action);

    // Kích hoạt animation
    keyBtn.classList.add('key-active');
    setTimeout(() => keyBtn.classList.remove('key-active'), 120);

    handleKeyAction(action, value);
  });

  function handleKeyAction(action, value) {
    switch (action) {
      case 'number':
      case 'insert':
        appendText(value);
        break;
      case 'operator':
        appendText(value);
        break;
      case 'dot':
        appendText('.');
        break;
      case 'power':
        appendText('^');
        break;
      case 'sqrt':
        appendText('√(');
        break;
      case 'factorial':
        appendText('!');
        break;
      case 'percent':
        appendText('%');
        break;
      case 'ans':
        appendText('Ans');
        break;
      case 'clear-all':
        handleClearAll();
        break;
      case 'backspace':
        handleBackspace();
        break;
      case 'calculate':
        handleCalculate();
        break;
    }
  }

  // Nhận diện bàn phím Laptop / PC
  window.addEventListener('keydown', (e) => {
    // Tránh xung đột nếu đang focus vào input hoặc textarea
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      return;
    }

    const key = e.key;
    let handled = false;
    let targetButton = null;

    if (/[0-9]/.test(key)) {
      appendText(key);
      targetButton = document.querySelector(`.calc-key[data-value="${key}"]`);
      handled = true;
    } else if (key === '+' || key === '-') {
      appendText(key);
      targetButton = document.querySelector(`.calc-key[data-value="${key}"]`);
      handled = true;
    } else if (key === '*' || key === 'x' || key === 'X') {
      appendText('×');
      targetButton = document.querySelector('.key-multiply');
      handled = true;
    } else if (key === '/' || key === ':') {
      appendText('÷');
      targetButton = document.querySelector('.key-divide');
      handled = true;
    } else if (key === '.' || key === ',') {
      appendText('.');
      targetButton = document.querySelector('.key-dot');
      handled = true;
    } else if (key === '^') {
      appendText('^');
      targetButton = document.querySelector('.key-power');
      handled = true;
    } else if (key === '!' || key === '1' && e.shiftKey) {
      appendText('!');
      targetButton = document.querySelector('.key-factorial');
      handled = true;
    } else if (key === '%') {
      appendText('%');
      targetButton = document.querySelector('.key-percent');
      handled = true;
    } else if (key === '(' || key === ')') {
      appendText(key);
      targetButton = document.querySelector(`.calc-key[data-value="${key}"]`);
      handled = true;
    } else if (key === 'r' || key === 'R' || key === 's' || key === 'S') {
      appendText('√(');
      targetButton = document.querySelector('.key-sqrt');
      handled = true;
    } else if (key === 'a' || key === 'A') {
      appendText('Ans');
      targetButton = document.querySelector('.key-ans');
      handled = true;
    } else if (key === 'Enter' || key === '=') {
      handleCalculate();
      targetButton = document.querySelector('.key-equals');
      handled = true;
    } else if (key === 'Backspace') {
      handleBackspace();
      targetButton = document.querySelector('.key-backspace');
      handled = true;
    } else if (key === 'Escape' || key === 'Delete') {
      handleClearAll();
      targetButton = document.querySelector('.key-ac');
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      SoundEngine.playKeySound(key);
      if (targetButton) {
        targetButton.classList.add('key-active');
        setTimeout(() => targetButton.classList.remove('key-active'), 120);
      }
    }
  });

  // ============================================================================
  // SIDEBAR DRAWER & THEME & SOUND TOGGLES
  // ============================================================================
  function openDrawer() {
    sideDrawer.classList.add('active');
    drawerOverlay.classList.add('active');
  }

  function closeDrawer() {
    sideDrawer.classList.remove('active');
    drawerOverlay.classList.remove('active');
  }

  menuToggleBtn.addEventListener('click', openDrawer);
  closeDrawerBtn.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  // Tab chuyển đổi trong Drawer
  drawerTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      drawerTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(tab.dataset.tab);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // Đổi Theme
  themeCards.forEach(card => {
    card.addEventListener('click', () => {
      const theme = card.dataset.theme;
      body.setAttribute('data-theme', theme);
      localStorage.setItem('calculator_theme', theme);

      themeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input');
      if (radio) radio.checked = true;
    });
  });

  // Đổi Âm thanh qua toggle switch trong drawer
  soundToggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    SoundEngine.setEnabled(isChecked);
    localStorage.setItem('calculator_sound', isChecked);
  });

  soundToneSelect.addEventListener('change', (e) => {
    const tone = e.target.value;
    SoundEngine.setTone(tone);
    localStorage.setItem('calculator_tone', tone);
    SoundEngine.playKeySound('5');
  });

  // Chuyển đổi định dạng Phân số / Thập phân S<=>D
  formatToggleBtn.addEventListener('click', toggleDisplayFormat);
  toggleFractionQuick.addEventListener('click', toggleDisplayFormat);

  // Khởi động
  loadPersistedState();
  renderExpression();
});

