/* ============================================================
   溯泍 AI 工具室 - 核心逻辑
   功能：加载数据 / 分类筛选 / 搜索 / 价格筛选 / 排序 / 详情模态框 / 主题切换
   ============================================================ */

(function () {
  "use strict";

  // ---------- 全局状态 ----------
  const state = {
    tools: [],            // 全部工具
    filtered: [],         // 当前筛选结果
    category: "全部",     // 当前分类
    pricing: "all",       // 当前价格筛选：all/free/freemium/paid
    sort: "rating",       // 排序方式：rating/name
    keyword: "",          // 搜索关键词
  };

  // 价格标签中文映射
  const PRICING_LABEL = {
    free: "免费",
    paid: "付费",
    freemium: "Freemium",
  };

  // ---------- DOM 引用 ----------
  const els = {
    grid: document.getElementById("toolsGrid"),
    count: document.getElementById("resultCount"),
    categoryPills: document.getElementById("categoryPills"),
    pricingSelect: document.getElementById("pricingSelect"),
    sortSelect: document.getElementById("sortSelect"),
    heroSearch: document.getElementById("heroSearch"),
    navSearch: document.getElementById("navSearch"),
    modal: document.getElementById("toolModal"),
    modalBody: document.getElementById("modalBody"),
    toastContainer: document.getElementById("toastContainer"),
    themeToggle: document.getElementById("themeToggle"),
    mobileMenuBtn: document.getElementById("mobileMenuBtn"),
    navMenu: document.getElementById("navMenu"),
    backToTop: document.getElementById("backToTop"),
  };

  // ---------- 工具函数：Toast 通知 ----------
  function toast(message, type = "info", duration = 2800) {
    if (!els.toastContainer) return;
    const icons = {
      success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };
    const node = document.createElement("div");
    node.className = `toast ${type}`;
    node.setAttribute("role", "status");
    node.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    els.toastContainer.appendChild(node);
    setTimeout(() => {
      node.classList.add("removing");
      node.addEventListener("animationend", () => node.remove(), { once: true });
    }, duration);
  }

  // ---------- 工具函数：防抖 ----------
  function debounce(fn, wait = 200) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // ---------- 工具函数：HTML 转义 ----------
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ---------- 工具函数：取工具首字符作为图标 ----------
  function getInitial(name) {
    if (!name) return "?";
    // 中文取第一个字，英文取首字母大写
    const first = name.trim().charAt(0);
    return first.toUpperCase();
  }

  // ---------- 加载工具数据 ----------
  async function loadTools() {
    showSkeleton();
    try {
      // 支持相对路径，便于本地与 GitHub Pages 部署
      const res = await fetch("tools.json", { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("数据为空");
      }
      state.tools = data;
      renderCategoryPills();
      applyFilters();
    } catch (err) {
      console.error("[loadTools] 加载失败:", err);
      els.grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3>数据加载失败</h3>
          <p>无法读取 tools.json，请通过本地服务器（如 Live Server）访问，或检查文件是否存在。</p>
        </div>`;
      toast("工具数据加载失败，请检查 tools.json", "error", 4000);
    }
  }

  // ---------- 渲染骨架屏 ----------
  function showSkeleton() {
    const skeletons = Array.from({ length: 8 }).map(() => `
      <div class="skeleton-card">
        <div style="display:flex;gap:12px;align-items:center;">
          <div class="skeleton" style="width:48px;height:48px;border-radius:12px;"></div>
          <div style="flex:1;">
            <div class="skeleton" style="width:60%;height:14px;margin-bottom:8px;"></div>
            <div class="skeleton" style="width:40%;height:11px;"></div>
          </div>
        </div>
        <div class="skeleton" style="width:100%;height:12px;"></div>
        <div class="skeleton" style="width:90%;height:12px;"></div>
        <div style="display:flex;gap:6px;margin-top:auto;">
          <div class="skeleton" style="width:50px;height:20px;border-radius:6px;"></div>
          <div class="skeleton" style="width:60px;height:20px;border-radius:6px;"></div>
        </div>
      </div>`).join("");
    els.grid.innerHTML = skeletons;
  }

  // ---------- 渲染分类标签 ----------
  function renderCategoryPills() {
    if (!els.categoryPills) return;
    // 统计每个分类的数量
    const counts = { "全部": state.tools.length };
    state.tools.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    // 顺序：全部 + 数据中出现的分类，保持稳定顺序
    const order = ["全部", "AI对话", "AI图片", "AI编程", "AI设计", "AI营销", "AI办公", "AI视频", "AI音频", "AI搜索"];
    const categories = order.filter(c => counts[c] > 0);
    // 补充任何遗漏的分类
    Object.keys(counts).forEach(c => {
      if (!categories.includes(c)) categories.push(c);
    });

    els.categoryPills.innerHTML = categories.map(cat => {
      const active = cat === state.category ? "active" : "";
      const safeCat = escapeHtml(cat);
      return `<button class="category-pill ${active}" data-category="${safeCat}" role="tab" aria-selected="${cat === state.category ? "true" : "false"}">
        ${safeCat}<span class="count">${counts[cat]}</span>
      </button>`;
    }).join("");

    els.categoryPills.querySelectorAll(".category-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        state.category = btn.dataset.category;
        // 同步激活态
        els.categoryPills.querySelectorAll(".category-pill").forEach(b => {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        applyFilters();
      });
    });
  }

  // ---------- 筛选 + 排序主流程 ----------
  function applyFilters() {
    const kw = state.keyword.trim().toLowerCase();
    state.filtered = state.tools.filter((t) => {
      // 分类筛选
      if (state.category !== "全部" && t.category !== state.category) return false;
      // 价格筛选
      if (state.pricing !== "all" && t.pricing !== state.pricing) return false;
      // 关键词搜索：名称、描述、分类、features
      if (kw) {
        const haystack = [
          t.name,
          t.description,
          t.category,
          (t.features || []).join(" "),
          (t.pros || []).join(" "),
        ].join(" ").toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });

    // 排序
    if (state.sort === "name") {
      state.filtered.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
    } else {
      // 默认按评分降序，评分相同按名称
      state.filtered.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return a.name.localeCompare(b.name, "zh-Hans-CN");
      });
    }

    renderTools();
    updateResultCount();
  }

  // ---------- 渲染工具卡片 ----------
  function renderTools() {
    if (state.filtered.length === 0) {
      els.grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <h3>未找到匹配的工具</h3>
          <p>试试更换关键词、切换分类或调整价格筛选。</p>
        </div>`;
      return;
    }

    els.grid.innerHTML = state.filtered.map((t, idx) => {
      const pricingClass = `tag-${t.pricing}`;
      const pricingLabel = PRICING_LABEL[t.pricing] || t.pricing;
      const initial = escapeHtml(getInitial(t.name));
      const tags = (t.features || []).slice(0, 2).map(f => `<span class="tag">${escapeHtml(f)}</span>`).join("");
      return `
        <article class="tool-card" data-id="${escapeHtml(t.id)}" tabindex="0" role="button" aria-label="${escapeHtml(t.name)} 详情" style="animation-delay:${Math.min(idx, 12) * 40}ms;">
          <div class="tool-card-head">
            <div class="tool-icon" aria-hidden="true">${initial}</div>
            <div style="min-width:0;flex:1;">
              <div class="tool-name">${escapeHtml(t.name)}</div>
              <div class="tool-category">${escapeHtml(t.category)}</div>
            </div>
          </div>
          <p class="tool-desc">${escapeHtml(t.description)}</p>
          <div class="tool-tags">
            <span class="tag ${pricingClass}">${pricingLabel}</span>
            ${tags}
          </div>
          <div class="tool-footer">
            <span class="tool-rating">
              <svg class="star" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              ${Number(t.rating).toFixed(1)}
            </span>
            <div style="display:flex;gap:8px;">
              <button class="detail-btn" data-action="detail" data-id="${escapeHtml(t.id)}" aria-label="查看 ${escapeHtml(t.name)} 详情">
                详情
              </button>
              <a class="visit-btn" href="${escapeHtml(t.url)}" target="_blank" rel="noopener" data-action="visit" aria-label="访问 ${escapeHtml(t.name)} 官网">
                访问官网
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </div>
        </article>`;
    }).join("");

    // 绑定卡片事件
    els.grid.querySelectorAll(".tool-card").forEach(card => {
      const id = card.dataset.id;
      // 整卡点击 → 打开详情（排除按钮与链接）
      card.addEventListener("click", (e) => {
        if (e.target.closest('[data-action="visit"]')) return; // 访问官网按钮不触发
        openDetail(id);
      });
      // 键盘可达性：Enter / Space 打开详情
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail(id);
        }
      });
    });
  }

  // ---------- 更新结果计数 ----------
  function updateResultCount() {
    if (!els.count) return;
    els.count.innerHTML = `共 <strong>${state.filtered.length}</strong> 款工具`;
  }

  // ---------- 打开详情模态框 ----------
  function openDetail(id) {
    const t = state.tools.find(x => x.id === id);
    if (!t) {
      toast("未找到该工具", "error");
      return;
    }
    const pricingLabel = PRICING_LABEL[t.pricing] || t.pricing;
    const featuresList = (t.features || []).map(f => `<li>${escapeHtml(f)}</li>`).join("");
    const prosList = (t.pros || []).map(p => `<li>${escapeHtml(p)}</li>`).join("");
    const consList = (t.cons || []).map(c => `<li>${escapeHtml(c)}</li>`).join("");

    els.modalBody.innerHTML = `
      <button class="modal-close" id="modalClose" aria-label="关闭详情">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="modal-head">
        <div class="tool-icon" style="width:56px;height:56px;font-size:22px;" aria-hidden="true">${escapeHtml(getInitial(t.name))}</div>
        <div style="min-width:0;">
          <div class="modal-title">${escapeHtml(t.name)}</div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap;">
            <span class="tag tag-${t.pricing}">${pricingLabel}</span>
            <span class="tag">${escapeHtml(t.category)}</span>
            <span class="tool-rating">
              <svg class="star" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              ${Number(t.rating).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <p style="font-size:15px;line-height:1.7;color:var(--text-secondary);margin-bottom:20px;">${escapeHtml(t.description)}</p>

      ${featuresList ? `
      <div class="modal-section">
        <h4>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          核心功能
        </h4>
        <ul>${featuresList}</ul>
      </div>` : ""}

      ${prosList ? `
      <div class="modal-section pros">
        <h4 style="color:#10b981;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          优点
        </h4>
        <ul>${prosList}</ul>
      </div>` : ""}

      ${consList ? `
      <div class="modal-section cons">
        <h4 style="color:#ef4444;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          不足
        </h4>
        <ul>${consList}</ul>
      </div>` : ""}

      ${t.review ? `
      <div class="modal-section">
        <h4>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          编辑评测
        </h4>
        <div class="modal-review">${escapeHtml(t.review)}</div>
      </div>` : ""}

      <div class="modal-actions">
        <a class="visit-btn" href="${escapeHtml(t.url)}" target="_blank" rel="noopener">
          访问官网
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </div>`;

    els.modal.classList.add("open");
    els.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // 绑定关闭按钮
    const closeBtn = document.getElementById("modalClose");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    // 焦点管理：聚焦关闭按钮
    setTimeout(() => closeBtn && closeBtn.focus(), 50);
  }

  function closeModal() {
    els.modal.classList.remove("open");
    els.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // ---------- 主题切换 ----------
  function initTheme() {
    if (!els.themeToggle) return;
    // 优先读取 localStorage，其次跟随系统
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    applyTheme(theme);

    els.themeToggle.addEventListener("click", () => {
      const current = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("theme", next);
      toast(next === "dark" ? "已切换至深色模式" : "已切换至浅色模式", "info", 1500);
    });
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  // ---------- 搜索框逻辑 ----------
  function initSearch() {
    const onHeroSearch = debounce((value) => {
      state.keyword = value;
      // 同步顶部导航搜索框
      if (els.navSearch) els.navSearch.value = value;
      // 显示/隐藏清空按钮
      toggleClearBtn(els.heroSearch);
      applyFilters();
    }, 180);

    const onNavSearch = debounce((value) => {
      state.keyword = value;
      if (els.heroSearch) els.heroSearch.value = value;
      toggleClearBtn(els.navSearch);
      applyFilters();
    }, 180);

    if (els.heroSearch) {
      const input = els.heroSearch.querySelector(".search-input");
      const clear = els.heroSearch.querySelector(".search-clear");
      input.addEventListener("input", (e) => onHeroSearch(e.target.value));
      if (clear) clear.addEventListener("click", () => {
        input.value = "";
        onHeroSearch("");
        input.focus();
      });
      // 读取 URL 参数 ?q=
      const urlQ = new URLSearchParams(window.location.search).get("q");
      if (urlQ) {
        input.value = urlQ;
        onHeroSearch(urlQ);
      }
    }
    if (els.navSearch) {
      const input = els.navSearch.querySelector(".search-input");
      const clear = els.navSearch.querySelector(".search-clear");
      input.addEventListener("input", (e) => onNavSearch(e.target.value));
      if (clear) clear.addEventListener("click", () => {
        input.value = "";
        onNavSearch("");
        input.focus();
      });
    }
  }

  function toggleClearBtn(wrap) {
    if (!wrap) return;
    const input = wrap.querySelector(".search-input");
    const clear = wrap.querySelector(".search-clear");
    if (!input || !clear) return;
    clear.classList.toggle("visible", input.value.length > 0);
  }

  // ---------- 筛选器与排序 ----------
  function initFilters() {
    if (els.pricingSelect) {
      els.pricingSelect.addEventListener("change", (e) => {
        state.pricing = e.target.value;
        applyFilters();
      });
    }
    if (els.sortSelect) {
      els.sortSelect.addEventListener("change", (e) => {
        state.sort = e.target.value;
        applyFilters();
      });
    }
  }

  // ---------- 模态框事件 ----------
  function initModal() {
    if (!els.modal) return;
    // 点击遮罩关闭
    els.modal.addEventListener("click", (e) => {
      if (e.target === els.modal) closeModal();
    });
    // ESC 关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && els.modal.classList.contains("open")) closeModal();
    });
  }

  // ---------- 移动端菜单 ----------
  function initMobileMenu() {
    if (!els.mobileMenuBtn || !els.navMenu) return;
    els.mobileMenuBtn.addEventListener("click", () => {
      const open = els.navMenu.classList.toggle("open");
      els.mobileMenuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // 点击菜单项后收起
    els.navMenu.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        els.navMenu.classList.remove("open");
        els.mobileMenuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---------- 返回顶部 ----------
  function initBackToTop() {
    if (!els.backToTop) return;
    window.addEventListener("scroll", debounce(() => {
      els.backToTop.classList.toggle("visible", window.scrollY > 400);
    }, 100), { passive: true });
    els.backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ---------- 锚点跳转：点击分类菜单跳到工具区 ----------
  function initAnchorLinks() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  // ---------- 启动 ----------
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initSearch();
    initFilters();
    initModal();
    initMobileMenu();
    initBackToTop();
    initAnchorLinks();
    loadTools();
    // 欢迎提示
    setTimeout(() => toast("已加载 " + "30+ 款精选 AI 工具", "success", 2200), 600);
  });

  // 暴露给全局便于调试（可选）
  window.__aiNav = { state, applyFilters, toast };
})();
