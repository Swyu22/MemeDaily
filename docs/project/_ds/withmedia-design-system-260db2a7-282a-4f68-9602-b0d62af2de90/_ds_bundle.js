/* @ds-bundle: {"format":3,"namespace":"WithMediaDesignSystem_260db2","components":[],"sourceHashes":{"ui_kits/intranet/DashboardScreen.jsx":"4625a2e1bade","ui_kits/intranet/LoginScreen.jsx":"48e363bbf1e6","ui_kits/intranet/PlaceholderScreen.jsx":"a49758919b85","ui_kits/intranet/ProjectsScreen.jsx":"82b1e8543b12","ui_kits/intranet/Shell.jsx":"c33a979a2638","ui_kits/intranet/app.jsx":"3a73ac146074","ui_kits/intranet/components.jsx":"bd9fcc4d50cf","ui_kits/intranet/data.jsx":"ac21aeef178f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.WithMediaDesignSystem_260db2 = window.WithMediaDesignSystem_260db2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/intranet/DashboardScreen.jsx
try { (() => {
/* WithMedia intranet UI kit — Dashboard (工作台) */

function StatCard({
  icon,
  label,
  value,
  delta,
  trend
}) {
  return /*#__PURE__*/React.createElement(Card, {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 15,
    color: "var(--zinc-400)"
  }), label), /*#__PURE__*/React.createElement("div", {
    className: "big"
  }, value), /*#__PURE__*/React.createElement("div", {
    className: `delta ${trend || 'flat'}`
  }, delta));
}
function ProjectCard({
  p,
  onOpen
}) {
  return /*#__PURE__*/React.createElement(Card, {
    className: "proj",
    onClick: () => onOpen(p)
  }, /*#__PURE__*/React.createElement("div", {
    className: "accent"
  }), /*#__PURE__*/React.createElement("div", {
    className: "body"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ttl"
  }, p.name), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, p.line, " \xB7 ", p.owner)), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    status: p.status
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bar"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: p.progress + '%'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "avstack"
  }, p.team.slice(0, 4).map((m, i) => /*#__PURE__*/React.createElement(Avatar, {
    key: i,
    name: m
  }))), /*#__PURE__*/React.createElement("span", {
    className: "pct"
  }, p.progress, "%"))));
}
function DashboardScreen({
  user,
  onOpenProject,
  onNewProject
}) {
  const active = PROJECTS.filter(p => p.status === 'active' || p.status === 'process');
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "\u665A\u4E0A\u597D\uFF0C", user.name.slice(-2)), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "\u4ECA\u5929\u6709 3 \u4E2A\u9879\u76EE\u7B49\u5F85\u4F60\u7684\u8DDF\u8FDB \xB7 2026-06-02")), /*#__PURE__*/React.createElement("div", {
    className: "toolbar"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    icon: "calendar",
    size: "sm"
  }, "\u672C\u5468"), /*#__PURE__*/React.createElement(Button, {
    variant: "brand",
    icon: "plus",
    onClick: onNewProject
  }, "\u65B0\u5EFA\u9879\u76EE"))), /*#__PURE__*/React.createElement("div", {
    className: "stat-grid"
  }, /*#__PURE__*/React.createElement(StatCard, {
    icon: "folder-kanban",
    label: "\u8FDB\u884C\u4E2D\u9879\u76EE",
    value: "7",
    delta: "\u2191 2 \u8F83\u4E0A\u5468",
    trend: "up"
  }), /*#__PURE__*/React.createElement(StatCard, {
    icon: "truck",
    label: "\u672C\u6708\u4EA4\u4ED8",
    value: "24",
    delta: "\u2191 12% \u73AF\u6BD4",
    trend: "up"
  }), /*#__PURE__*/React.createElement(StatCard, {
    icon: "check-square",
    label: "\u5F85\u5904\u7406\u4EFB\u52A1",
    value: "8",
    delta: "\u4ECA\u65E5\u622A\u6B62 3 \u9879"
  }), /*#__PURE__*/React.createElement(StatCard, {
    icon: "users",
    label: "\u56E2\u961F\u6210\u5458",
    value: "36",
    delta: "5 \u4E2A\u7EC4"
  })), /*#__PURE__*/React.createElement("div", {
    className: "two-col"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "section-title"
  }, "\u8FDB\u884C\u4E2D\u7684\u9879\u76EE"), /*#__PURE__*/React.createElement("div", {
    className: "proj-grid"
  }, active.map(p => /*#__PURE__*/React.createElement(ProjectCard, {
    key: p.id,
    p: p,
    onOpen: onOpenProject
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "section-title"
  }, "\u6700\u8FD1\u6D3B\u52A8"), /*#__PURE__*/React.createElement(Card, {
    style: {
      padding: '6px 18px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "feed"
  }, ACTIVITY.map((a, i) => /*#__PURE__*/React.createElement("div", {
    className: "item",
    key: i
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: a.who,
    className: "av"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "txt"
  }, /*#__PURE__*/React.createElement("b", null, a.who), " ", a.what, " ", /*#__PURE__*/React.createElement("b", null, a.target), a.tail || ''), /*#__PURE__*/React.createElement("div", {
    className: "time"
  }, a.time)))))))));
}
Object.assign(window, {
  DashboardScreen,
  ProjectCard,
  StatCard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/intranet/DashboardScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/intranet/LoginScreen.jsx
try { (() => {
/* WithMedia intranet UI kit — Login (钉钉扫码登录 only) */

/* Deterministic pseudo-QR — a visual mock, not a real scannable code. */
function QRMock({
  onScan
}) {
  const N = 23;
  const cells = [];
  // simple deterministic pattern
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const v = (x * 7 + y * 13 + x * y * 3) % 5;
      const on = v === 0 || v === 2;
      cells.push(on);
    }
  }
  const isFinder = (x, y) => x < 7 && y < 7 || x >= N - 7 && y < 7 || x < 7 && y >= N - 7;
  return /*#__PURE__*/React.createElement("div", {
    className: "qr",
    onClick: onScan,
    title: "\u70B9\u51FB\u6A21\u62DF\u626B\u7801\u767B\u5F55"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qr-grid",
    style: {
      gridTemplateColumns: `repeat(${N},1fr)`
    }
  }, cells.map((on, i) => {
    const x = i % N,
      y = Math.floor(i / N);
    if (isFinder(x, y)) return /*#__PURE__*/React.createElement("span", {
      key: i
    });
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      className: on ? 'on' : ''
    });
  })), /*#__PURE__*/React.createElement("span", {
    className: "finder tl"
  }), /*#__PURE__*/React.createElement("span", {
    className: "finder tr"
  }), /*#__PURE__*/React.createElement("span", {
    className: "finder bl"
  }), /*#__PURE__*/React.createElement("div", {
    className: "qr-center"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    alt: ""
  })), /*#__PURE__*/React.createElement("div", {
    className: "qr-hover"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "scan-line",
    size: 22
  }), "\u70B9\u51FB\u6A21\u62DF\u626B\u7801"));
}
function LoginScreen({
  onLogin
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "login"
  }, /*#__PURE__*/React.createElement("div", {
    className: "login-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "login-brand"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    alt: "WithMedia"
  }), /*#__PURE__*/React.createElement("span", {
    className: "wm"
  }, "WithMedia", /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }, "."))), /*#__PURE__*/React.createElement("h2", null, "\u626B\u7801\u767B\u5F55"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "\u521B\u82E5\u8131\u5154 \xB7 \u4E0E\u4F17\u5185\u90E8\u534F\u4F5C\u5E73\u53F0"), /*#__PURE__*/React.createElement(QRMock, {
    onScan: onLogin
  }), /*#__PURE__*/React.createElement("div", {
    className: "scan-tip"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dingding"
  }, "\u9489"), /*#__PURE__*/React.createElement("span", null, "\u6253\u5F00 ", /*#__PURE__*/React.createElement("b", null, "\u9489\u9489"), " App\uFF0C\u626B\u4E00\u626B\u767B\u5F55")), /*#__PURE__*/React.createElement("div", {
    className: "qr-refresh"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "rotate-cw",
    size: 13
  }), " \u4E8C\u7EF4\u7801 04:58 \u540E\u5931\u6548\uFF0C\u70B9\u51FB\u5237\u65B0")));
}
Object.assign(window, {
  LoginScreen,
  QRMock
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/intranet/LoginScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/intranet/PlaceholderScreen.jsx
try { (() => {
/* WithMedia intranet UI kit — placeholder for sections intentionally
   left blank in the kit (kit replicates the design language, not every screen). */

function PlaceholderScreen({
  title
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, title), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "\u8BE5\u6A21\u5757\u672A\u5305\u542B\u5728\u672C UI Kit \u4E2D"))), /*#__PURE__*/React.createElement(Card, {
    style: {
      padding: '56px 32px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 14,
      background: 'var(--zinc-100)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--zinc-400)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "layers",
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, "\u300C", title, "\u300D\u7559\u5F85\u771F\u5B9E\u5B9E\u73B0"), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      maxWidth: 360,
      fontSize: 14
    }
  }, "UI Kit \u4E13\u6CE8\u590D\u523B\u8BBE\u8BA1\u8BED\u8A00\u4E0E\u6838\u5FC3\u7EC4\u4EF6\u3002\u6B64\u6A21\u5757\u6309\u89C4\u8303\u7559\u7A7A\uFF0C\u63A5\u5165\u771F\u5B9E\u6570\u636E\u65F6\u518D\u884C\u642D\u5EFA\u3002")));
}
Object.assign(window, {
  PlaceholderScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/intranet/PlaceholderScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/intranet/ProjectsScreen.jsx
try { (() => {
/* WithMedia intranet UI kit — Projects (项目) + New Project dialog */

function NewProjectDialog({
  onClose,
  onCreate
}) {
  const [name, setName] = useState('');
  const [line, setLine] = useState('视觉设计');
  return /*#__PURE__*/React.createElement(Dialog, {
    title: "\u65B0\u5EFA\u9879\u76EE",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      onClick: onClose
    }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement(Button, {
      variant: "brand",
      icon: "check",
      onClick: () => onCreate({
        name: name || '未命名项目',
        line
      })
    }, "\u521B\u5EFA"))
  }, /*#__PURE__*/React.createElement(Input, {
    label: "\u9879\u76EE\u540D\u79F0",
    placeholder: "\u4F8B\u5982\uFF1A\u5E74\u5EA6\u54C1\u724C\u7115\u65B0",
    value: name,
    onChange: e => setName(e.target.value),
    autoFocus: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "\u4E1A\u52A1\u7EBF"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, ['视觉设计', '影视制作', '营销策划', '交互开发', '线下活动'].map(l => /*#__PURE__*/React.createElement("button", {
    key: l,
    type: "button",
    onClick: () => setLine(l),
    className: `btn btn-sm ${line === l ? 'btn-primary' : 'btn-outline'}`
  }, l)))), /*#__PURE__*/React.createElement(Input, {
    label: "\u8D1F\u8D23\u4EBA",
    placeholder: "\u9009\u62E9\u6210\u5458",
    icon: "user"
  }));
}
function ProjectsScreen({
  onOpenProject,
  openDialogSignal
}) {
  const [tab, setTab] = useState('all');
  const [dialog, setDialog] = useState(false);
  const [extra, setExtra] = useState([]);
  useEffect(() => {
    if (openDialogSignal) setDialog(true);
  }, [openDialogSignal]);
  const all = [...extra, ...PROJECTS];
  const filtered = all.filter(p => tab === 'all' ? true : tab === 'active' ? p.status === 'active' || p.status === 'process' : tab === 'done' ? p.status === 'done' : p.status === 'paused' || p.status === 'canceled');
  const tabs = [{
    value: 'all',
    label: '全部',
    count: all.length
  }, {
    value: 'active',
    label: '进行中'
  }, {
    value: 'done',
    label: '已完成'
  }, {
    value: 'archived',
    label: '已归档'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "\u9879\u76EE"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "\u5171 ", all.length, " \u4E2A\u9879\u76EE \xB7 \u8DE8 5 \u6761\u4E1A\u52A1\u7EBF")), /*#__PURE__*/React.createElement("div", {
    className: "toolbar"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    icon: "sliders-horizontal",
    size: "sm"
  }, "\u7B5B\u9009"), /*#__PURE__*/React.createElement(Button, {
    variant: "brand",
    icon: "plus",
    onClick: () => setDialog(true)
  }, "\u65B0\u5EFA\u9879\u76EE"))), /*#__PURE__*/React.createElement(Tabs, {
    tabs: tabs,
    value: tab,
    onChange: setTab
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 320,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "\u6309\u540D\u79F0\u6216\u7F16\u53F7\u641C\u7D22\u2026"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    icon: "arrow-up-down",
    size: "sm"
  }, "\u6700\u8FD1\u66F4\u65B0")), /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u9879\u76EE"), /*#__PURE__*/React.createElement("th", null, "\u4E1A\u52A1\u7EBF"), /*#__PURE__*/React.createElement("th", null, "\u8D1F\u8D23\u4EBA"), /*#__PURE__*/React.createElement("th", null, "\u72B6\u6001"), /*#__PURE__*/React.createElement("th", null, "\u8FDB\u5EA6"), /*#__PURE__*/React.createElement("th", null, "\u622A\u6B62"), /*#__PURE__*/React.createElement("th", null, "\u66F4\u65B0"))), /*#__PURE__*/React.createElement("tbody", null, filtered.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.id,
    onClick: () => onOpenProject(p)
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    className: "mono muted",
    style: {
      fontSize: 11
    }
  }, p.id)), /*#__PURE__*/React.createElement("td", {
    className: "muted"
  }, p.line), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.owner,
    className: "av"
  }), " ", p.owner)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(StatusBadge, {
    status: p.status
  })), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, p.progress, "%"), /*#__PURE__*/React.createElement("td", {
    className: "mono muted"
  }, p.due), /*#__PURE__*/React.createElement("td", {
    className: "muted",
    style: {
      fontSize: 13
    }
  }, p.updated)))))), dialog && /*#__PURE__*/React.createElement(NewProjectDialog, {
    onClose: () => setDialog(false),
    onCreate: np => {
      setExtra([{
        id: 'WM-2026-0' + (490 + extra.length),
        name: np.name,
        line: np.line,
        owner: '林楠',
        status: 'active',
        progress: 0,
        due: '—',
        team: ['林楠'],
        updated: '刚刚'
      }, ...extra]);
      setDialog(false);
      setTab('all');
    }
  }));
}
Object.assign(window, {
  ProjectsScreen,
  NewProjectDialog
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/intranet/ProjectsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/intranet/Shell.jsx
try { (() => {
/* WithMedia intranet UI kit — app shell (brand + topbar + sidebar) */

function Shell({
  active,
  onNav,
  user,
  children
}) {
  const nav = [{
    key: 'dashboard',
    label: '工作台',
    icon: 'layout-dashboard'
  }, {
    key: 'projects',
    label: '项目',
    icon: 'folder-kanban',
    count: 12
  }, {
    key: 'tasks',
    label: '任务',
    icon: 'check-square',
    count: 8
  }, {
    key: 'team',
    label: '团队',
    icon: 'users'
  }, {
    key: 'resources',
    label: '资源',
    icon: 'image'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-area"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    alt: "WithMedia"
  }), /*#__PURE__*/React.createElement("span", {
    className: "wm"
  }, "WithMedia", /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }, "."))), /*#__PURE__*/React.createElement("div", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "search"
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "\u641C\u7D22\u9879\u76EE\u3001\u4EFB\u52A1\u6216\u6210\u5458\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    className: "spacer"
  }), /*#__PURE__*/React.createElement("button", {
    className: "iconbtn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 19
  })), /*#__PURE__*/React.createElement("button", {
    className: "iconbtn"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ndot"
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: 19
  })), /*#__PURE__*/React.createElement("button", {
    className: "iconbtn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "help-circle",
    size: 19
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 24,
      background: 'var(--border)',
      margin: '0 4px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: user.name
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      lineHeight: 1.2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, user.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--muted-foreground)'
    }
  }, user.role)), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 15,
    color: "var(--zinc-400)"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "sidebar"
  }, nav.map(n => /*#__PURE__*/React.createElement("div", {
    key: n.key,
    className: `nav-item ${active === n.key ? 'active' : ''}`,
    onClick: () => onNav(n.key)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: n.icon,
    size: 18
  }), /*#__PURE__*/React.createElement("span", null, n.label), n.count != null && /*#__PURE__*/React.createElement("span", {
    className: "count"
  }, n.count))), /*#__PURE__*/React.createElement("div", {
    className: "nav-section"
  }, "\u7CFB\u7EDF"), /*#__PURE__*/React.createElement("div", {
    className: "nav-item",
    onClick: () => onNav('settings')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "settings",
    size: 18
  }), /*#__PURE__*/React.createElement("span", null, "\u8BBE\u7F6E")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "nav-item",
    onClick: () => onNav('logout')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "log-out",
    size: 18
  }), /*#__PURE__*/React.createElement("span", null, "\u9000\u51FA\u767B\u5F55"))), /*#__PURE__*/React.createElement("div", {
    className: "main"
  }, children));
}
Object.assign(window, {
  Shell
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/intranet/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/intranet/app.jsx
try { (() => {
/* WithMedia intranet UI kit — app state machine + entry */

function App() {
  const [authed, setAuthed] = useState(false);
  const [nav, setNav] = useState('dashboard');
  const [dialogSignal, setDialogSignal] = useState(0);
  const user = {
    name: '林楠',
    role: '设计总监'
  };
  if (!authed) return /*#__PURE__*/React.createElement(LoginScreen, {
    onLogin: () => {
      setAuthed(true);
      setNav('dashboard');
    }
  });
  const handleNav = key => {
    if (key === 'logout') {
      setAuthed(false);
      return;
    }
    setNav(key);
  };
  const openProjectsAndCreate = () => {
    setNav('projects');
    setDialogSignal(s => s + 1);
  };
  let screen;
  if (nav === 'dashboard') {
    screen = /*#__PURE__*/React.createElement(DashboardScreen, {
      user: user,
      onOpenProject: () => setNav('projects'),
      onNewProject: openProjectsAndCreate
    });
  } else if (nav === 'projects') {
    screen = /*#__PURE__*/React.createElement(ProjectsScreen, {
      onOpenProject: () => {},
      openDialogSignal: dialogSignal
    });
  } else {
    const titles = {
      tasks: '任务',
      team: '团队',
      resources: '资源',
      settings: '设置'
    };
    screen = /*#__PURE__*/React.createElement(PlaceholderScreen, {
      title: titles[nav] || '页面'
    });
  }
  return /*#__PURE__*/React.createElement(Shell, {
    active: nav,
    onNav: handleNav,
    user: user
  }, screen);
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/intranet/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/intranet/components.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* WithMedia intranet UI kit — shared primitives.
   Exposed on window for use by screen files. */

const {
  useState,
  useEffect,
  useRef
} = React;

/* ---- Icon: renders a Lucide icon via the UMD global ---- */
function Icon({
  name,
  size = 16,
  color,
  style
}) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !window.lucide) return;
    node.innerHTML = `<i data-lucide="${name}"></i>`;
    window.lucide.createIcons();
    const svg = node.querySelector('svg');
    if (svg) {
      svg.setAttribute('width', size);
      svg.setAttribute('height', size);
      svg.style.width = size + 'px';
      svg.style.height = size + 'px';
    }
  }, [name, size]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      display: 'inline-flex',
      width: size,
      height: size,
      color,
      ...style
    }
  });
}

/* ---- Button ---- */
function Button({
  variant = 'secondary',
  size,
  icon,
  iconRight,
  children,
  className = '',
  ...rest
}) {
  const cls = ['btn', `btn-${variant}`, size === 'sm' ? 'btn-sm' : '', !children ? 'btn-icon' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls
  }, rest), icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: size === 'sm' ? 15 : 16
  }), children, iconRight && /*#__PURE__*/React.createElement(Icon, {
    name: iconRight,
    size: size === 'sm' ? 15 : 16
  }));
}

/* ---- Status badge ---- */
const STATUS = {
  active: {
    label: '进行中',
    key: 'active'
  },
  process: {
    label: '流程中',
    key: 'process'
  },
  paused: {
    label: '已暂停',
    key: 'paused'
  },
  done: {
    label: '已完成',
    key: 'done'
  },
  canceled: {
    label: '已取消',
    key: 'canceled'
  }
};
function StatusBadge({
  status
}) {
  const s = STATUS[status] || STATUS.active;
  return /*#__PURE__*/React.createElement("span", {
    className: "badge",
    style: {
      background: `var(--status-${s.key}-bg)`,
      color: `var(--status-${s.key}-fg)`
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: `var(--status-${s.key}-dot)`
    }
  }), s.label);
}

/* ---- Input ---- */
function Input({
  label,
  icon,
  id,
  ...rest
}) {
  const field = icon ? /*#__PURE__*/React.createElement("div", {
    className: "input-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16
  })), /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    className: "input"
  }, rest))) : /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    className: "input"
  }, rest));
  if (!label) return field;
  return /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: id
  }, label), field);
}

/* ---- Avatar ---- */
function Avatar({
  name,
  className = ''
}) {
  const initial = (name || '?').trim().slice(-2);
  return /*#__PURE__*/React.createElement("span", {
    className: `avatar ${className}`
  }, initial);
}

/* ---- Card ---- */
function Card({
  children,
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `card ${className}`
  }, rest), children);
}

/* ---- Tabs ---- */
function Tabs({
  tabs,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.value,
    className: `tab ${value === t.value ? 'active' : ''}`,
    onClick: () => onChange(t.value)
  }, t.label, t.count != null ? ` ${t.count}` : '')));
}

/* ---- Dialog ---- */
function Dialog({
  title,
  children,
  footer,
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "scrim",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "dialog",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "dh"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ttl"
  }, title), /*#__PURE__*/React.createElement("button", {
    className: "iconbtn",
    style: {
      width: 30,
      height: 30
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dbody"
  }, children), /*#__PURE__*/React.createElement("div", {
    className: "dfoot"
  }, footer)));
}
Object.assign(window, {
  Icon,
  Button,
  StatusBadge,
  Input,
  Avatar,
  Card,
  Tabs,
  Dialog,
  STATUS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/intranet/components.jsx", error: String((e && e.message) || e) }); }

// ui_kits/intranet/data.jsx
try { (() => {
/* WithMedia intranet UI kit — sample data */

const PROJECTS = [{
  id: 'WM-2026-0481',
  name: '年度品牌焕新',
  line: '视觉设计',
  owner: '林楠',
  status: 'active',
  progress: 68,
  due: '06-30',
  team: ['林楠', '陈一', '苏文', '赵晓', '周宇'],
  updated: '2 小时前'
}, {
  id: 'WM-2026-0479',
  name: '夏季产品发布片',
  line: '影视制作',
  owner: '陈一鸣',
  status: 'process',
  progress: 42,
  due: '07-15',
  team: ['陈一', '周宇', '赵晓'],
  updated: '昨天'
}, {
  id: 'WM-2026-0463',
  name: '城南快闪活动',
  line: '线下活动',
  owner: '苏文',
  status: 'paused',
  progress: 30,
  due: '07-02',
  team: ['苏文', '林楠'],
  updated: '3 天前'
}, {
  id: 'WM-2026-0455',
  name: '官网交互改版',
  line: '交互开发',
  owner: '赵晓',
  status: 'done',
  progress: 100,
  due: '05-28',
  team: ['赵晓', '周宇'],
  updated: '上周'
}, {
  id: 'WM-2026-0448',
  name: '双十一营销战役',
  line: '营销策划',
  owner: '周宇',
  status: 'active',
  progress: 55,
  due: '11-01',
  team: ['周宇', '苏文', '林楠', '陈一'],
  updated: '5 小时前'
}, {
  id: 'WM-2026-0431',
  name: '旧版 VI 收尾',
  line: '视觉设计',
  owner: '林楠',
  status: 'canceled',
  progress: 20,
  due: '—',
  team: ['林楠'],
  updated: '2 周前'
}];
const ACTIVITY = [{
  who: '陈一鸣',
  what: '上传了 3 个新版本到',
  target: '夏季产品发布片',
  time: '15 分钟前'
}, {
  who: '赵晓',
  what: '将',
  target: '官网交互改版',
  tail: ' 标记为已完成',
  time: '2 小时前'
}, {
  who: '苏文',
  what: '暂停了',
  target: '城南快闪活动',
  time: '今天 10:24'
}, {
  who: '周宇',
  what: '在',
  target: '双十一营销战役',
  tail: ' 中新建了 5 个任务',
  time: '昨天'
}];
Object.assign(window, {
  PROJECTS,
  ACTIVITY
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/intranet/data.jsx", error: String((e && e.message) || e) }); }

})();
