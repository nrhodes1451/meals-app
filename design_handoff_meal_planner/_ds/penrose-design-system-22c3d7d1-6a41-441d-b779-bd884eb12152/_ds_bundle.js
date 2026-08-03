/* @ds-bundle: {"format":4,"namespace":"PenroseDesignSystem_22c3d7","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"ListRow","sourcePath":"components/data/ListRow.jsx"},{"name":"StatFigure","sourcePath":"components/data/StatFigure.jsx"},{"name":"DecoBand","sourcePath":"components/deco/DecoBand.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Icon","sourcePath":"components/icon/Icon.jsx"},{"name":"NavRail","sourcePath":"components/navigation/NavRail.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Badge","sourcePath":"components/status/Badge.jsx"},{"name":"Tag","sourcePath":"components/status/Tag.jsx"},{"name":"Toast","sourcePath":"components/status/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/status/Tooltip.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"Dialog","sourcePath":"components/surfaces/Dialog.jsx"},{"name":"Divider","sourcePath":"components/surfaces/Divider.jsx"},{"name":"SectionHeader","sourcePath":"components/surfaces/SectionHeader.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"24d21eb3023b","components/actions/IconButton.jsx":"3c1fc439bc63","components/data/DataTable.jsx":"600f96a9bf1b","components/data/ListRow.jsx":"2d62ab72fca9","components/data/StatFigure.jsx":"f1efae761473","components/deco/DecoBand.jsx":"7ffc9153cf8b","components/forms/Checkbox.jsx":"5e4e93085c6f","components/forms/Field.jsx":"87246bfd9100","components/forms/Input.jsx":"90e66317eed3","components/forms/Radio.jsx":"bf7e51258972","components/forms/Select.jsx":"01f61568e66f","components/forms/Switch.jsx":"bb064767b8c7","components/icon/Icon.jsx":"232839181bd2","components/navigation/NavRail.jsx":"2fe479923975","components/navigation/Tabs.jsx":"d2d403b3cd1e","components/status/Badge.jsx":"bea6c9d214d3","components/status/Tag.jsx":"9c5628c951c5","components/status/Toast.jsx":"26a345e3b05f","components/status/Tooltip.jsx":"ac9faf0acbbf","components/surfaces/Card.jsx":"35d3178971a4","components/surfaces/Dialog.jsx":"24860999ea80","components/surfaces/Divider.jsx":"576922a870ab","components/surfaces/SectionHeader.jsx":"302795cf3e8d","ui_kits/household/App.jsx":"c8c2b28bd28d","ui_kits/household/HouseScreen.jsx":"86cebae3f80d","ui_kits/household/SettingsScreen.jsx":"06e2eed7fd2c","ui_kits/household/TodayScreen.jsx":"747247e1815b","ui_kits/ledger/EntriesScreen.jsx":"5cab183d03a7","ui_kits/ledger/EntryDetail.jsx":"627c7ad183b4","ui_kits/ledger/LedgerApp.jsx":"a567c60d131a","ui_kits/ledger/NewEntryScreen.jsx":"55f658e20290"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.PenroseDesignSystem_22c3d7 = window.PenroseDesignSystem_22c3d7 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  fontFamily: "var(--font-display)",
  textTransform: "uppercase",
  letterSpacing: "var(--track-label)",
  fontWeight: 700,
  borderRadius: "var(--radius-none)",
  border: 0,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--space-1)",
  transition: "background-color var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)",
  lineHeight: 1
};
const sizes = {
  md: {
    minHeight: "var(--touch)",
    padding: "0 var(--space-3)",
    fontSize: "var(--size-label)"
  },
  lg: {
    minHeight: "56px",
    padding: "0 var(--space-4)",
    fontSize: "var(--size-h3)"
  }
};
const variants = {
  primary: {
    background: "var(--action)",
    color: "var(--pen-ground)"
  },
  secondary: {
    background: "var(--pen-primary-tint)",
    color: "var(--pen-primary)"
  },
  quiet: {
    background: "transparent",
    color: "var(--pen-primary)"
  },
  destructive: {
    background: "var(--pen-danger)",
    color: "var(--pen-paper)"
  }
};
const hovers = {
  primary: {
    background: "var(--action-hover)"
  },
  secondary: {
    background: "#FFB8DF"
  },
  quiet: {
    background: "var(--pen-primary-tint)"
  },
  destructive: {
    background: "#A0121F"
  }
};
function Button({
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  iconLeft,
  iconRight,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...sizes[size],
      ...variants[variant],
      ...(hover && !disabled ? hovers[variant] : null),
      width: block ? "100%" : undefined,
      opacity: disabled ? 0.4 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
      ...style
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function IconButton({
  label,
  variant = "secondary",
  children,
  disabled = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const fills = {
    primary: {
      background: "var(--action)",
      color: "var(--pen-ground)",
      hover: "var(--action-hover)"
    },
    secondary: {
      background: "var(--pen-primary-tint)",
      color: "var(--pen-primary)",
      hover: "#FFB8DF"
    },
    quiet: {
      background: "transparent",
      color: "var(--pen-ink)",
      hover: "var(--pen-primary-tint)"
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: "var(--touch)",
      height: "var(--touch)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      border: 0,
      borderRadius: "var(--radius-none)",
      background: hover && !disabled ? fills.hover : fills.background,
      color: fills.color,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      padding: 0,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
function DataTable({
  columns = [],
  rows = [],
  selectedId,
  onRowClick,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: "auto",
      maxWidth: "100%"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      minWidth: 420,
      borderCollapse: "collapse",
      background: "transparent",
      ...style
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      textAlign: c.align || "left",
      fontFamily: "var(--font-display)",
      textTransform: "uppercase",
      letterSpacing: "var(--track-label)",
      fontWeight: 700,
      fontSize: "var(--size-label)",
      color: "var(--pen-ink)",
      padding: "var(--space-1) var(--space-2)",
      borderBottom: "1px solid var(--pen-ink)",
      whiteSpace: "nowrap"
    }
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.map(r => {
    const selected = r.id === selectedId;
    return /*#__PURE__*/React.createElement("tr", {
      key: r.id,
      onClick: () => onRowClick && onRowClick(r),
      style: {
        background: selected ? "var(--pen-primary-tint)" : "transparent",
        cursor: onRowClick ? "pointer" : "default"
      }
    }, columns.map(c => /*#__PURE__*/React.createElement("td", {
      key: c.key,
      style: {
        textAlign: c.align || "left",
        padding: "0 var(--space-2)",
        height: "var(--touch)",
        borderBottom: "1px solid rgba(47,61,50,0.25)",
        fontSize: "var(--size-body-sm)",
        color: "var(--pen-ink)",
        fontVariantNumeric: c.numeric ? "tabular-nums" : "normal",
        fontWeight: c.numeric ? 700 : 400,
        whiteSpace: "nowrap"
      }
    }, r[c.key])));
  }))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/data/ListRow.jsx
try { (() => {
function ListRow({
  primary,
  secondary,
  meta,
  trailing,
  selected = false,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    role: onClick ? "button" : undefined,
    tabIndex: onClick ? 0 : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)",
      minHeight: 64,
      padding: "var(--space-1) var(--space-2)",
      borderBottom: "1px solid rgba(47,61,50,0.25)",
      background: selected ? "var(--pen-primary-tint)" : hover && onClick ? "var(--pen-primary-tint)" : "transparent",
      cursor: onClick ? "pointer" : "default",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--size-body)",
      color: "var(--pen-ink)",
      fontWeight: 400
    }
  }, primary), secondary && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--size-caption)",
      color: "var(--pen-ink)",
      opacity: 0.75
    }
  }, secondary)), meta && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: "var(--size-h3)",
      fontVariantNumeric: "tabular-nums",
      color: "var(--pen-ink)"
    }
  }, meta), trailing);
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/data/StatFigure.jsx
try { (() => {
function StatFigure({
  label,
  value,
  unit,
  tone = "ink",
  style
}) {
  const color = {
    ink: "var(--pen-ink)",
    primary: "var(--pen-primary)",
    inverse: "var(--pen-ground)"
  }[tone];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      textTransform: "uppercase",
      letterSpacing: "var(--track-label)",
      fontWeight: 300,
      fontSize: "var(--size-label)",
      color
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      fontSize: "var(--size-figure)",
      lineHeight: 1,
      fontVariantNumeric: "tabular-nums",
      color
    }
  }, value, unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--size-h3)",
      fontWeight: 300,
      marginLeft: 4
    }
  }, unit)));
}
Object.assign(__ds_scope, { StatFigure });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatFigure.jsx", error: String((e && e.message) || e) }); }

// components/deco/DecoBand.jsx
try { (() => {
const SHAPES = {
  rhomb: "polygon(50% 0,100% 50%,50% 100%,0 50%)",
  kite: "polygon(50% 0,100% 38%,50% 100%,0 38%)",
  dart: "polygon(50% 0,100% 100%,50% 68%,0 100%)",
  chevron: "polygon(0 0,50% 0,100% 100%,50% 100%)",
  step: "polygon(0 100%,0 60%,33% 60%,33% 30%,66% 30%,66% 0,100% 0,100% 100%)"
};
function DecoBand({
  shape = "rhomb",
  count = 12,
  height = 32,
  colors = ["var(--pen-primary)", "var(--pen-primary-lift)"],
  style
}) {
  const tiles = Array.from({
    length: count
  }, (_, i) => i);
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      display: "flex",
      gap: 0,
      height,
      ...style
    }
  }, tiles.map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      height: "100%",
      background: colors[i % colors.length],
      clipPath: SHAPES[shape],
      transform: shape === "dart" && i % 2 ? "rotate(180deg)" : undefined
    }
  })));
}
Object.assign(__ds_scope, { DecoBand });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/deco/DecoBand.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-2)",
      minHeight: "var(--touch)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      fontSize: "var(--size-body)",
      color: "var(--pen-ink)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      opacity: 0,
      width: 1,
      height: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 28,
      height: 28,
      flex: "0 0 auto",
      border: 0,
      background: checked ? "var(--action)" : "var(--pen-accent-tint)",
      display: "grid",
      placeItems: "center"
    }
  }, checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      background: "var(--pen-ground)",
      clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)"
    }
  })), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-1)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      fontFamily: "var(--font-display)",
      textTransform: "uppercase",
      letterSpacing: "var(--track-label)",
      fontWeight: 700,
      fontSize: "var(--size-label)",
      color: "var(--pen-ink)"
    }
  }, label), children, (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--size-caption)",
      color: error ? "var(--pen-danger)" : "var(--pen-ink)",
      lineHeight: 1.4
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  invalid = false,
  tabular = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("input", _extends({
    style: {
      minHeight: "var(--touch)",
      padding: "0 var(--space-1)",
      fontFamily: "var(--font-body)",
      fontSize: "var(--size-body)",
      color: "var(--pen-ink)",
      background: "var(--pen-paper)",
      border: 0,
      borderBottom: invalid ? "2px solid var(--pen-danger)" : "1px solid var(--pen-ink)",
      borderRadius: "var(--radius-none)",
      width: "100%",
      fontVariantNumeric: tabular ? "tabular-nums" : "normal",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  name,
  value,
  checked = false,
  onChange,
  label,
  disabled = false,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-2)",
      minHeight: "var(--touch)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      fontSize: "var(--size-body)",
      color: "var(--pen-ink)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    disabled: disabled,
    onChange: () => onChange && onChange(value),
    style: {
      position: "absolute",
      opacity: 0,
      width: 1,
      height: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 28,
      height: 28,
      flex: "0 0 auto",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      gridArea: "1/1",
      background: checked ? "var(--action)" : "var(--pen-accent-tint)",
      clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)"
    }
  }), checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      gridArea: "1/1",
      placeSelf: "center",
      background: "var(--pen-ground)",
      clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)"
    }
  })), label);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  options = [],
  invalid = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("select", _extends({
    style: {
      minHeight: "var(--touch)",
      padding: "0 var(--space-1)",
      fontFamily: "var(--font-body)",
      fontSize: "var(--size-body)",
      color: "var(--pen-ink)",
      background: "var(--pen-paper)",
      border: 0,
      borderBottom: invalid ? "2px solid var(--pen-danger)" : "1px solid var(--pen-ink)",
      borderRadius: "var(--radius-none)",
      width: "100%",
      appearance: "none",
      ...style
    }
  }, rest), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label)));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked = false,
  onChange,
  label,
  disabled = false,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-2)",
      minHeight: "var(--touch)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      fontSize: "var(--size-body)",
      color: "var(--pen-ink)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    role: "switch",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      opacity: 0,
      width: 1,
      height: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 64,
      height: 32,
      flex: "0 0 auto",
      border: 0,
      background: checked ? "var(--action)" : "var(--pen-accent-tint)",
      display: "flex",
      alignItems: "center",
      justifyContent: checked ? "flex-end" : "flex-start",
      padding: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      background: checked ? "var(--pen-ground)" : "var(--pen-ink)"
    }
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/icon/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Lucide is the substituted icon set for Penrose — 2px stroke, geometric, square terminals.
   Loaded from CDN by the consuming page: https://unpkg.com/lucide@latest/dist/umd/lucide.js */
function Icon({
  name,
  size = 20,
  color = "currentColor",
  strokeWidth = 2,
  style,
  ...rest
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !window.lucide) return;
    el.innerHTML = "";
    const i = document.createElement("i");
    i.setAttribute("data-lucide", name);
    i.setAttribute("width", size);
    i.setAttribute("height", size);
    i.setAttribute("stroke-width", strokeWidth);
    el.appendChild(i);
    window.lucide.createIcons({
      nameAttr: "data-lucide",
      root: el
    });
  }, [name, size, strokeWidth]);
  return /*#__PURE__*/React.createElement("span", _extends({
    ref: ref,
    "aria-hidden": "true",
    style: {
      display: "inline-flex",
      width: size,
      height: size,
      color,
      flex: "0 0 auto",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icon/Icon.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavRail.jsx
try { (() => {
function NavRail({
  items = [],
  value,
  onChange,
  title = "Penrose",
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      width: 232,
      background: "var(--pen-ink)",
      color: "var(--pen-ground)",
      display: "flex",
      flexDirection: "column",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-3) var(--space-2)",
      borderBottom: "1px solid var(--pen-accent-gold)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      fontWeight: 900,
      fontSize: 22
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, items.map(it => {
    const active = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      onClick: () => onChange && onChange(it.value),
      "aria-current": active ? "page" : undefined,
      style: {
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        minHeight: 56,
        padding: "0 var(--space-2)",
        background: active ? "var(--action)" : "transparent",
        color: active ? "var(--pen-ground)" : "var(--pen-ground)",
        border: 0,
        borderBottom: "1px solid rgba(233,203,79,0.35)",
        fontFamily: "var(--font-display)",
        textTransform: "uppercase",
        letterSpacing: "var(--track-label)",
        fontWeight: active ? 900 : 400,
        fontSize: "var(--size-label)",
        cursor: "pointer",
        textAlign: "left"
      }
    }, it.icon, it.label);
  })));
}
Object.assign(__ds_scope, { NavRail });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavRail.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: "flex",
      borderBottom: "1px solid var(--pen-ink)",
      ...style
    }
  }, items.map(it => {
    const active = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      role: "tab",
      "aria-selected": active,
      onClick: () => onChange && onChange(it.value),
      style: {
        minHeight: "var(--touch)",
        padding: "0 var(--space-3)",
        fontFamily: "var(--font-display)",
        textTransform: "uppercase",
        letterSpacing: "var(--track-label)",
        fontWeight: active ? 900 : 400,
        fontSize: "var(--size-label)",
        color: active ? "var(--pen-primary)" : "var(--pen-ink)",
        background: "transparent",
        border: 0,
        boxShadow: active ? "inset 0 -4px 0 0 var(--action)" : "none",
        cursor: "pointer"
      }
    }, it.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/status/Badge.jsx
try { (() => {
function Badge({
  tone = "neutral",
  children,
  style
}) {
  const tones = {
    neutral: {
      background: "var(--pen-primary-tint)",
      color: "var(--pen-ink)",
      borderColor: "var(--pen-primary-tint)"
    },
    success: {
      background: "var(--pen-success)",
      color: "var(--pen-paper)",
      borderColor: "var(--pen-success)"
    },
    warning: {
      background: "var(--pen-warning)",
      color: "var(--pen-ink)",
      borderColor: "var(--pen-warning)"
    },
    danger: {
      background: "var(--pen-danger)",
      color: "var(--pen-paper)",
      borderColor: "var(--pen-danger)"
    },
    ink: {
      background: "var(--pen-ink)",
      color: "var(--pen-ground)",
      borderColor: "var(--pen-ink)"
    }
  }[tone];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      minHeight: 24,
      padding: "2px var(--space-1)",
      fontFamily: "var(--font-display)",
      textTransform: "uppercase",
      letterSpacing: "var(--track-label)",
      fontWeight: 700,
      fontSize: "var(--size-caption)",
      ...tones,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/Badge.jsx", error: String((e && e.message) || e) }); }

// components/status/Tag.jsx
try { (() => {
function Tag({
  children,
  onRemove,
  selected = false,
  onClick,
  style
}) {
  const interactive = !!onClick;
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    role: interactive ? "button" : undefined,
    tabIndex: interactive ? 0 : undefined,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-1)",
      minHeight: interactive || onRemove ? "var(--touch-min)" : 32,
      padding: "0 var(--space-2)",
      background: selected ? "var(--action)" : "var(--pen-primary-tint)",
      color: selected ? "var(--pen-ground)" : "var(--pen-ink)",
      border: 0,
      fontSize: "var(--size-body-sm)",
      cursor: interactive ? "pointer" : "default",
      ...style
    }
  }, children, onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Remove",
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    style: {
      width: 32,
      height: 32,
      border: 0,
      background: "transparent",
      color: "inherit",
      fontSize: 20,
      cursor: "pointer",
      lineHeight: 1
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/Tag.jsx", error: String((e && e.message) || e) }); }

// components/status/Toast.jsx
try { (() => {
function Toast({
  tone = "ink",
  children,
  onDismiss,
  style
}) {
  const tones = {
    ink: {
      background: "var(--pen-ink)",
      color: "var(--pen-ground)"
    },
    success: {
      background: "var(--pen-success)",
      color: "var(--pen-paper)"
    },
    danger: {
      background: "var(--pen-danger)",
      color: "var(--pen-paper)"
    }
  }[tone];
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)",
      minHeight: "var(--touch)",
      padding: "var(--space-1) var(--space-2)",
      borderLeft: "4px solid var(--pen-accent-gold)",
      fontSize: "var(--size-body-sm)",
      ...tones,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, children), onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onDismiss,
    style: {
      minWidth: "var(--touch-min)",
      minHeight: "var(--touch-min)",
      background: "transparent",
      border: "1px solid currentColor",
      color: "inherit",
      fontFamily: "var(--font-display)",
      textTransform: "uppercase",
      letterSpacing: "var(--track-label)",
      fontSize: "var(--size-caption)",
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "Dismiss"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/Toast.jsx", error: String((e && e.message) || e) }); }

// components/status/Tooltip.jsx
try { (() => {
function Tooltip({
  label,
  children,
  style
}) {
  const [open, setOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex",
      ...style
    },
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false)
  }, children, open && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: "absolute",
      bottom: "calc(100% + 6px)",
      left: 0,
      whiteSpace: "nowrap",
      background: "var(--pen-ink)",
      color: "var(--pen-ground)",
      padding: "4px var(--space-1)",
      fontSize: "var(--size-caption)",
      fontFamily: "var(--font-display)",
      textTransform: "uppercase",
      letterSpacing: "var(--track-label)",
      zIndex: 50
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  title,
  action,
  tone = "paper",
  children,
  style,
  ...rest
}) {
  const tones = {
    paper: {
      background: "var(--pen-paper)",
      color: "var(--pen-ink)",
      borderTop: "1px solid var(--pen-ink)"
    },
    blush: {
      background: "var(--pen-accent-blush)",
      color: "var(--pen-ink)"
    },
    dark: {
      background: "var(--pen-ink)",
      color: "var(--pen-ground)"
    },
    tint: {
      background: "var(--pen-primary-tint)",
      color: "var(--pen-ink)"
    }
  }[tone];
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      borderRadius: "var(--radius-none)",
      padding: "var(--space-3)",
      ...tones,
      ...style
    }
  }, rest), title && /*#__PURE__*/React.createElement("header", {
    style: {
      marginBottom: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-display)",
      textTransform: "uppercase",
      letterSpacing: "var(--track-heading)",
      fontWeight: 900,
      fontSize: "var(--size-h3)",
      margin: 0
    }
  }, title), action), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 0,
      borderTop: "1px solid currentColor",
      opacity: 0.25,
      marginTop: "var(--space-1)"
    }
  })), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Dialog.jsx
try { (() => {
function Dialog({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === "string" ? title : undefined,
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(47,61,50,0.7)",
      display: "grid",
      placeItems: "center",
      padding: "var(--space-3)",
      zIndex: 100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--pen-paper)",
      width: "min(560px,100%)",
      padding: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      textTransform: "uppercase",
      letterSpacing: "var(--track-heading)",
      fontWeight: 900,
      fontSize: "var(--size-h2)",
      margin: 0
    }
  }, title), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    label: "Close",
    variant: "quiet",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 24,
      lineHeight: 1
    }
  }, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 0,
      borderTop: "1px solid rgba(47,61,50,0.25)",
      margin: "var(--space-1) 0 var(--space-3)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--size-body)",
      lineHeight: "var(--leading-body)"
    }
  }, children), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-1)",
      justifyContent: "flex-end",
      marginTop: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    onClick: onClose
  }, cancelLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: destructive ? "destructive" : "primary",
    onClick: onConfirm
  }, confirmLabel))));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Divider.jsx
try { (() => {
function Divider({
  variant = "single",
  spacing = "var(--space-2)",
  style
}) {
  const common = {
    border: 0,
    margin: `${spacing} 0`
  };
  if (variant === "strong") {
    return /*#__PURE__*/React.createElement("hr", {
      style: {
        ...common,
        borderTop: "1px solid var(--pen-ink)",
        ...style
      }
    });
  }
  if (variant === "metallic") {
    return /*#__PURE__*/React.createElement("hr", {
      style: {
        ...common,
        borderTop: "1px solid var(--pen-accent-gold)",
        ...style
      }
    });
  }
  return /*#__PURE__*/React.createElement("hr", {
    style: {
      ...common,
      borderTop: "1px solid rgba(47,61,50,0.25)",
      ...style
    }
  });
}
Object.assign(__ds_scope, { Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Divider.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/SectionHeader.jsx
try { (() => {
function SectionHeader({
  children,
  meta,
  level = 2,
  style
}) {
  const Tag = "h" + level;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: "var(--space-2)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    style: {
      fontFamily: "var(--font-display)",
      textTransform: "uppercase",
      letterSpacing: "var(--track-heading)",
      fontWeight: 900,
      fontSize: level === 1 ? "var(--size-h1)" : "var(--size-h2)",
      margin: 0,
      color: "var(--pen-ink)"
    }
  }, children), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      textTransform: "uppercase",
      letterSpacing: "var(--track-label)",
      fontSize: "var(--size-label)",
      fontWeight: 300,
      color: "var(--pen-ink)"
    }
  }, meta)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 0,
      borderTop: "1px solid rgba(47,61,50,0.25)",
      marginTop: "var(--space-1)"
    }
  }));
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// ui_kits/household/App.jsx
try { (() => {
const {
  NavRail,
  Icon,
  Toast,
  DecoBand
} = window.PenroseDesignSystem_22c3d7;
function HouseholdApp() {
  const [view, setView] = React.useState("today");
  const [toast, setToast] = React.useState(null);
  const notify = msg => setToast(msg);
  const nav = [{
    value: "today",
    label: "Today",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "home",
      size: 20
    })
  }, {
    value: "house",
    label: "House",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      size: 20
    })
  }, {
    value: "settings",
    label: "Settings",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "settings",
      size: 20
    })
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "232px 1fr",
      height: "100vh",
      background: "var(--pen-paper)"
    }
  }, /*#__PURE__*/React.createElement(NavRail, {
    title: "Penrose",
    items: nav,
    value: view,
    onChange: setView
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      overflow: "auto",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(DecoBand, {
    shape: "chevron",
    count: 40,
    height: 12,
    colors: ["var(--pen-primary)", "var(--pen-primary-tint)"]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-4)",
      maxWidth: 1000
    }
  }, view === "today" && /*#__PURE__*/React.createElement(TodayScreen, {
    notify: notify
  }), view === "house" && /*#__PURE__*/React.createElement(HouseScreen, {
    notify: notify
  }), view === "settings" && /*#__PURE__*/React.createElement(SettingsScreen, {
    notify: notify
  })), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      left: 256,
      bottom: 24,
      width: 380
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    onDismiss: () => setToast(null)
  }, toast))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(HouseholdApp, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/household/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/household/HouseScreen.jsx
try { (() => {
const {
  SectionHeader,
  Tabs,
  DataTable,
  Tag,
  Divider,
  DecoBand,
  Button,
  Icon,
  Dialog
} = window.PenroseDesignSystem_22c3d7;
const JOBS = {
  month: [{
    id: 1,
    job: "Gas meter reading",
    who: "Either",
    when: "1st",
    note: "Photograph the dial"
  }, {
    id: 2,
    job: "Electric meter reading",
    who: "Either",
    when: "1st",
    note: ""
  }, {
    id: 3,
    job: "Filter — kitchen tap",
    who: "A",
    when: "Mid-month",
    note: "Cartridge in the drawer"
  }, {
    id: 4,
    job: "Standing orders check",
    who: "B",
    when: "4th",
    note: ""
  }],
  year: [{
    id: 5,
    job: "Boiler service",
    who: "B",
    when: "August",
    note: "Same engineer as last year"
  }, {
    id: 6,
    job: "Gutters",
    who: "A",
    when: "October",
    note: ""
  }, {
    id: 7,
    job: "Insurance renewal",
    who: "B",
    when: "January",
    note: "Compare before auto-renew"
  }]
};
function HouseScreen({
  notify
}) {
  const [tab, setTab] = React.useState("month");
  const [filter, setFilter] = React.useState("all");
  const [confirm, setConfirm] = React.useState(null);
  const rows = JOBS[tab].filter(r => filter === "all" || r.who === filter);
  const cols = [{
    key: "job",
    label: "Job"
  }, {
    key: "who",
    label: "Who"
  }, {
    key: "when",
    label: "When"
  }, {
    key: "note",
    label: "Note"
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHeader, {
    level: 1,
    meta: "Recurring"
  }, "House"), /*#__PURE__*/React.createElement(Tabs, {
    items: [{
      value: "month",
      label: "Monthly"
    }, {
      value: "year",
      label: "Yearly"
    }],
    value: tab,
    onChange: setTab,
    style: {
      marginTop: "var(--space-3)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-1)",
      margin: "var(--space-2) 0"
    }
  }, [["all", "Everyone"], ["A", "A"], ["B", "B"], ["Either", "Either"]].map(([v, l]) => /*#__PURE__*/React.createElement(Tag, {
    key: v,
    selected: filter === v,
    onClick: () => setFilter(v)
  }, l))), /*#__PURE__*/React.createElement(DataTable, {
    columns: cols,
    rows: rows,
    onRowClick: r => setConfirm(r)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-2)",
      display: "flex",
      gap: "var(--space-1)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 18
    }),
    onClick: () => notify("New recurring job added.")
  }, "Add job"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "download",
      size: 18
    }),
    onClick: () => notify("Exported to the shared folder.")
  }, "Export")), /*#__PURE__*/React.createElement(Divider, {
    variant: "metallic",
    spacing: "var(--space-4)"
  }), /*#__PURE__*/React.createElement(DecoBand, {
    shape: "kite",
    count: 18,
    height: 44,
    colors: ["var(--pen-primary-tint)", "var(--pen-primary-lift)"]
  }), /*#__PURE__*/React.createElement(Dialog, {
    open: !!confirm,
    title: confirm ? confirm.job : "",
    confirmLabel: "Mark done",
    onClose: () => setConfirm(null),
    onConfirm: () => {
      notify(confirm.job + " marked done.");
      setConfirm(null);
    }
  }, confirm && (confirm.note || "No note.")));
}
window.HouseScreen = HouseScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/household/HouseScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/household/SettingsScreen.jsx
try { (() => {
const {
  SectionHeader,
  Field,
  Input,
  Select,
  Switch,
  Radio,
  Divider,
  Button,
  Toast
} = window.PenroseDesignSystem_22c3d7;
function SettingsScreen({
  notify
}) {
  const [quiet, setQuiet] = React.useState(true);
  const [sync, setSync] = React.useState(false);
  const [start, setStart] = React.useState("today");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 640
    }
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    level: 1
  }, "Settings"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-3)",
      marginTop: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Household name",
    htmlFor: "hn"
  }, /*#__PURE__*/React.createElement(Input, {
    id: "hn",
    defaultValue: "Penrose Road"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Currency"
  }, /*#__PURE__*/React.createElement(Select, {
    options: [{
      value: "gbp",
      label: "GBP"
    }, {
      value: "eur",
      label: "EUR"
    }]
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Week starts"
  }, /*#__PURE__*/React.createElement(Select, {
    options: [{
      value: "mon",
      label: "Monday"
    }, {
      value: "sun",
      label: "Sunday"
    }]
  }))), /*#__PURE__*/React.createElement(Divider, {
    variant: "strong"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      textTransform: "uppercase",
      letterSpacing: "var(--track-label)",
      fontWeight: 700,
      fontSize: "var(--size-label)",
      marginBottom: "var(--space-1)"
    }
  }, "Opening screen"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(Radio, {
    name: "start",
    value: "today",
    checked: start === "today",
    onChange: setStart,
    label: "Today"
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "start",
    value: "house",
    checked: start === "house",
    onChange: setStart,
    label: "House"
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "start",
    value: "ledger",
    checked: start === "ledger",
    onChange: setStart,
    label: "Ledger"
  }))), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(Switch, {
    checked: quiet,
    onChange: setQuiet,
    label: "Quiet hours \u2014 no reminders 21:00 to 08:00"
  }), /*#__PURE__*/React.createElement(Switch, {
    checked: sync,
    onChange: setSync,
    label: "Copy the ledger to the shared folder nightly"
  }), /*#__PURE__*/React.createElement(Divider, {
    variant: "metallic"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-1)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: () => notify("Settings saved.")
  }, "Save"), /*#__PURE__*/React.createElement(Button, {
    variant: "quiet"
  }, "Discard")), /*#__PURE__*/React.createElement(Toast, null, "Changes apply on save. Nothing here leaves the house.")));
}
window.SettingsScreen = SettingsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/household/SettingsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/household/TodayScreen.jsx
try { (() => {
const {
  SectionHeader,
  StatFigure,
  Checkbox,
  Divider,
  Badge,
  ListRow,
  Icon,
  Button,
  Card
} = window.PenroseDesignSystem_22c3d7;
const INITIAL = [{
  id: 1,
  text: "Bins out — recycling week",
  done: false,
  tag: "Tue"
}, {
  id: 2,
  text: "Water bill, standing order check",
  done: false,
  tag: "Due"
}, {
  id: 3,
  text: "Boiler service — confirm time",
  done: true,
  tag: "Done"
}, {
  id: 4,
  text: "Read the gas meter",
  done: false,
  tag: "Monthly"
}];
function TodayScreen({
  notify
}) {
  const [items, setItems] = React.useState(INITIAL);
  const toggle = id => setItems(prev => prev.map(i => i.id === id ? {
    ...i,
    done: !i.done
  } : i));
  const left = items.filter(i => !i.done).length;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHeader, {
    level: 1,
    meta: "Sunday 2 August"
  }, "Today"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-8)",
      margin: "var(--space-3) 0 var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(StatFigure, {
    label: "Open",
    value: left
  }), /*#__PURE__*/React.createElement(StatFigure, {
    label: "Spent this month",
    value: "284.40",
    unit: "GBP",
    tone: "primary"
  }), /*#__PURE__*/React.createElement(StatFigure, {
    label: "Gas since reading",
    value: "41",
    unit: "m\xB3"
  })), /*#__PURE__*/React.createElement(Divider, {
    variant: "strong"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr",
      gap: "var(--space-4)",
      marginTop: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHeader, {
    level: 3,
    meta: left + " open"
  }, "List"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--pen-accent-tint)"
    }
  }, items.map(it => /*#__PURE__*/React.createElement("div", {
    key: it.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)",
      padding: "0 var(--space-2)",
      borderBottom: "1px solid rgba(47,61,50,0.25)"
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    checked: it.done,
    onChange: () => toggle(it.id),
    label: /*#__PURE__*/React.createElement("span", {
      style: {
        textDecoration: it.done ? "line-through" : "none",
        opacity: it.done ? 0.55 : 1
      }
    }, it.text),
    style: {
      flex: 1,
      minHeight: 64
    }
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: it.done ? "success" : it.tag === "Due" ? "warning" : "neutral"
  }, it.tag)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 18
    }),
    onClick: () => notify("Added to today's list.")
  }, "Add item"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-2)",
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Next up"
  }, /*#__PURE__*/React.createElement(ListRow, {
    primary: "Boiler service",
    secondary: "Thursday, 09:00\u201311:00",
    trailing: /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-right",
      size: 20
    }),
    onClick: () => notify("Opened boiler service.")
  }), /*#__PURE__*/React.createElement(ListRow, {
    primary: "Standing order \u2014 water",
    secondary: "4 August",
    meta: "42.10",
    style: {
      borderBottom: "none"
    }
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Meter",
    tone: "tint"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement(StatFigure, {
    label: "Gas, last read 12 Jul",
    value: "04182"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => notify("Reading recorded.")
  }, "Record"))))));
}
window.TodayScreen = TodayScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/household/TodayScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ledger/EntriesScreen.jsx
try { (() => {
const {
  SectionHeader,
  DataTable,
  StatFigure,
  Divider,
  Input,
  Tag,
  Button,
  Icon,
  Select,
  DecoBand
} = window.PenroseDesignSystem_22c3d7;
function EntriesScreen({
  rows,
  selected,
  onSelect,
  onNew
}) {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("All");
  const cats = ["All", "Utilities", "Food", "House", "Garden"];
  const filtered = rows.filter(r => (cat === "All" || r.cat === cat) && r.name.toLowerCase().includes(q.toLowerCase()));
  const total = filtered.reduce((s, r) => s + parseFloat(r.amt), 0).toFixed(2);
  const cols = [{
    key: "date",
    label: "Date"
  }, {
    key: "name",
    label: "Entry"
  }, {
    key: "cat",
    label: "Category"
  }, {
    key: "who",
    label: "Who"
  }, {
    key: "amt",
    label: "Amount",
    align: "right",
    numeric: true
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    level: 1,
    meta: filtered.length + " entries"
  }, "Entries"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-4)",
      margin: "var(--space-3) 0"
    }
  }, /*#__PURE__*/React.createElement(StatFigure, {
    label: "Shown",
    value: total,
    unit: "GBP"
  }), /*#__PURE__*/React.createElement(StatFigure, {
    label: "Month to date",
    value: "359.14",
    unit: "GBP",
    tone: "primary"
  })), /*#__PURE__*/React.createElement(Divider, {
    variant: "strong"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-1)",
      margin: "var(--space-2) 0",
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Search entries",
    value: q,
    onChange: e => setQ(e.target.value),
    style: {
      width: 260,
      flex: "1 1 200px",
      maxWidth: 260
    }
  }), /*#__PURE__*/React.createElement(Select, {
    options: [{
      value: "recent",
      label: "Most recent"
    }, {
      value: "amount",
      label: "Largest first"
    }],
    style: {
      width: 180,
      flex: "0 0 180px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 18
    }),
    onClick: onNew,
    style: {
      whiteSpace: "nowrap"
    }
  }, "New entry")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-1)",
      marginBottom: "var(--space-2)",
      flexWrap: "wrap"
    }
  }, cats.map(c => /*#__PURE__*/React.createElement(Tag, {
    key: c,
    selected: cat === c,
    onClick: () => setCat(c)
  }, c))), /*#__PURE__*/React.createElement(DataTable, {
    columns: cols,
    rows: filtered,
    selectedId: selected && selected.id,
    onRowClick: onSelect
  }), filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      border: 0,
      background: "var(--pen-paper)",
      padding: "var(--space-4)",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(DecoBand, {
    shape: "dart",
    count: 9,
    height: 40,
    colors: ["var(--pen-primary-tint)"],
    style: {
      maxWidth: 240,
      margin: "0 auto var(--space-2)"
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--size-body-sm)"
    }
  }, "Nothing matches that.")));
}
window.EntriesScreen = EntriesScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ledger/EntriesScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ledger/EntryDetail.jsx
try { (() => {
const {
  Card,
  Badge,
  Divider,
  Button,
  Icon,
  Dialog,
  ListRow,
  Tooltip,
  IconButton
} = window.PenroseDesignSystem_22c3d7;
function EntryDetail({
  entry,
  onDelete
}) {
  const [confirm, setConfirm] = React.useState(false);
  if (!entry) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-2)",
      position: "sticky",
      top: "var(--space-4)",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: entry.name,
    action: /*#__PURE__*/React.createElement(Tooltip, {
      label: "Edit entry"
    }, /*#__PURE__*/React.createElement(IconButton, {
      label: "Edit entry",
      variant: "quiet"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "pencil",
      size: 22
    })))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: "var(--space-2)",
      marginBottom: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      fontSize: 40,
      lineHeight: 1,
      fontVariantNumeric: "tabular-nums"
    }
  }, entry.amt), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 300,
      letterSpacing: "var(--track-label)"
    }
  }, "GBP")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "var(--space-1)",
      marginBottom: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(Badge, null, entry.cat), /*#__PURE__*/React.createElement(Badge, {
    tone: "ink"
  }, entry.date), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, "Paid by " + entry.who)), /*#__PURE__*/React.createElement(Divider, {
    variant: "metallic"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--size-body-sm)",
      margin: "var(--space-1) 0 0"
    }
  }, entry.note || "No note.")), /*#__PURE__*/React.createElement(Card, {
    title: "History"
  }, /*#__PURE__*/React.createElement(ListRow, {
    primary: "Last year, same bill",
    meta: "39.80",
    secondary: "August"
  }), /*#__PURE__*/React.createElement(ListRow, {
    primary: "Two years ago",
    meta: "36.20",
    secondary: "August",
    style: {
      borderBottom: "none"
    }
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "destructive",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "trash-2",
      size: 18
    }),
    onClick: () => setConfirm(true)
  }, "Delete entry"), /*#__PURE__*/React.createElement(Dialog, {
    open: confirm,
    title: "Delete entry",
    destructive: true,
    confirmLabel: "Delete",
    onClose: () => setConfirm(false),
    onConfirm: () => {
      onDelete(entry);
      setConfirm(false);
    }
  }, "This removes \u201C", entry.name, "\u201D from the ledger. There is no undo."));
}
window.EntryDetail = EntryDetail;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ledger/EntryDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ledger/LedgerApp.jsx
try { (() => {
const {
  NavRail,
  Icon,
  Toast,
  DecoBand
} = window.PenroseDesignSystem_22c3d7;
const SEED = [{
  id: 1,
  name: "Water bill",
  cat: "Utilities",
  date: "01 Aug",
  amt: "42.10",
  who: "B",
  note: "Standing order, quarterly review in October."
}, {
  id: 2,
  name: "Groceries",
  cat: "Food",
  date: "01 Aug",
  amt: "88.65",
  who: "A",
  note: ""
}, {
  id: 3,
  name: "Boiler service",
  cat: "House",
  date: "31 Jul",
  amt: "120.00",
  who: "B",
  note: "Annual. Same engineer."
}, {
  id: 4,
  name: "Electric",
  cat: "Utilities",
  date: "29 Jul",
  amt: "63.40",
  who: "Either",
  note: ""
}, {
  id: 5,
  name: "Seed compost",
  cat: "Garden",
  date: "27 Jul",
  amt: "14.99",
  who: "A",
  note: ""
}, {
  id: 6,
  name: "Broadband",
  cat: "Utilities",
  date: "25 Jul",
  amt: "31.00",
  who: "B",
  note: "Contract ends March."
}];
function LedgerApp() {
  const [view, setView] = React.useState("entries");
  const [rows, setRows] = React.useState(SEED);
  const [selected, setSelected] = React.useState(SEED[0]);
  const [toast, setToast] = React.useState(null);
  const nav = [{
    value: "entries",
    label: "Entries",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "list",
      size: 20
    })
  }, {
    value: "new",
    label: "New entry",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 20
    })
  }, {
    value: "meters",
    label: "Meters",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "circle-dot",
      size: 20
    })
  }];
  const add = row => {
    setRows(prev => [{
      ...row,
      id: Date.now()
    }, ...prev]);
    setToast("Entry added to the ledger.");
    setView("entries");
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "232px 1fr",
      height: "100vh",
      background: "var(--pen-paper)"
    }
  }, /*#__PURE__*/React.createElement(NavRail, {
    title: "Ledger",
    items: nav,
    value: view,
    onChange: setView
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement(DecoBand, {
    shape: "rhomb",
    count: 40,
    height: 12,
    colors: ["var(--pen-accent)", "var(--pen-accent-soft)"]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-4)"
    }
  }, view === "entries" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(520px,1fr))",
      gap: "var(--space-4)",
      alignItems: "start",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(EntriesScreen, {
    rows: rows,
    selected: selected,
    onSelect: setSelected,
    onNew: () => setView("new")
  }), /*#__PURE__*/React.createElement(EntryDetail, {
    entry: selected,
    onDelete: e => {
      setRows(p => p.filter(r => r.id !== e.id));
      setToast("Entry deleted.");
    }
  })), view === "new" && /*#__PURE__*/React.createElement(NewEntryScreen, {
    onSave: add,
    onCancel: () => setView("entries")
  }), view === "meters" && /*#__PURE__*/React.createElement(MetersScreen, null)), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      left: 256,
      bottom: 24,
      width: 380
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    onDismiss: () => setToast(null)
  }, toast))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(LedgerApp, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ledger/LedgerApp.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ledger/NewEntryScreen.jsx
try { (() => {
const {
  SectionHeader,
  Field,
  Input,
  Select,
  Radio,
  Checkbox,
  Button,
  Divider,
  DecoBand
} = window.PenroseDesignSystem_22c3d7;
function NewEntryScreen({
  onSave,
  onCancel
}) {
  const [form, setForm] = React.useState({
    name: "",
    amt: "",
    cat: "Utilities",
    who: "A",
    date: "02 Aug",
    note: ""
  });
  const [recurring, setRecurring] = React.useState(false);
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target ? e.target.value : e
  }));
  const invalid = form.amt !== "" && isNaN(parseFloat(form.amt));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720
    }
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    level: 1,
    meta: "Not saved"
  }, "New entry"), /*#__PURE__*/React.createElement(DecoBand, {
    shape: "step",
    count: 10,
    height: 20,
    colors: ["var(--pen-accent-gold)"],
    style: {
      margin: "var(--space-2) 0 var(--space-3)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "What was it",
    htmlFor: "n"
  }, /*#__PURE__*/React.createElement(Input, {
    id: "n",
    value: form.name,
    onChange: set("name"),
    placeholder: "Water bill"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Amount",
    error: invalid ? "Numbers only" : undefined,
    hint: invalid ? undefined : "GBP"
  }, /*#__PURE__*/React.createElement(Input, {
    tabular: true,
    value: form.amt,
    onChange: set("amt"),
    invalid: invalid,
    placeholder: "0.00"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Category"
  }, /*#__PURE__*/React.createElement(Select, {
    value: form.cat,
    onChange: set("cat"),
    options: ["Utilities", "Food", "House", "Garden"].map(c => ({
      value: c,
      label: c
    }))
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Date"
  }, /*#__PURE__*/React.createElement(Input, {
    value: form.date,
    onChange: set("date")
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      textTransform: "uppercase",
      letterSpacing: "var(--track-label)",
      fontWeight: 700,
      fontSize: "var(--size-label)",
      marginBottom: "var(--space-1)"
    }
  }, "Paid by"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)"
    }
  }, ["A", "B", "Either"].map(w => /*#__PURE__*/React.createElement(Radio, {
    key: w,
    name: "who",
    value: w,
    checked: form.who === w,
    onChange: v => setForm(f => ({
      ...f,
      who: v
    })),
    label: w
  })))), /*#__PURE__*/React.createElement(Field, {
    label: "Note"
  }, /*#__PURE__*/React.createElement(Input, {
    value: form.note,
    onChange: set("note"),
    placeholder: "Optional"
  })), /*#__PURE__*/React.createElement(Checkbox, {
    checked: recurring,
    onChange: setRecurring,
    label: "Repeats every month"
  }), /*#__PURE__*/React.createElement(Divider, {
    variant: "strong"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-1)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    disabled: !form.name || invalid,
    onClick: () => onSave({
      ...form,
      amt: form.amt || "0.00"
    })
  }, "Save entry"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "secondary",
    onClick: onCancel
  }, "Cancel"))));
}
window.NewEntryScreen = NewEntryScreen;
const {
  SectionHeader: SH,
  DataTable: DT,
  StatFigure: SF,
  Divider: DV,
  Button: BT,
  Icon: IC
} = window.PenroseDesignSystem_22c3d7;
function MetersScreen() {
  const cols = [{
    key: "date",
    label: "Date"
  }, {
    key: "meter",
    label: "Meter"
  }, {
    key: "reading",
    label: "Reading",
    align: "right",
    numeric: true
  }, {
    key: "use",
    label: "Since last",
    align: "right",
    numeric: true
  }];
  const rows = [{
    id: 1,
    date: "01 Aug",
    meter: "Gas",
    reading: "04182",
    use: "41"
  }, {
    id: 2,
    date: "01 Aug",
    meter: "Electric",
    reading: "18904",
    use: "212"
  }, {
    id: 3,
    date: "01 Jul",
    meter: "Gas",
    reading: "04141",
    use: "38"
  }, {
    id: 4,
    date: "01 Jul",
    meter: "Electric",
    reading: "18692",
    use: "198"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 820
    }
  }, /*#__PURE__*/React.createElement(SH, {
    level: 1,
    meta: "Read on the 1st"
  }, "Meters"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-8)",
      margin: "var(--space-3) 0"
    }
  }, /*#__PURE__*/React.createElement(SF, {
    label: "Gas, last month",
    value: "41",
    unit: "m\xB3"
  }), /*#__PURE__*/React.createElement(SF, {
    label: "Electric, last month",
    value: "212",
    unit: "kWh"
  }), /*#__PURE__*/React.createElement(SF, {
    label: "Est. cost",
    value: "94.40",
    unit: "GBP",
    tone: "primary"
  })), /*#__PURE__*/React.createElement(DV, {
    variant: "strong"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(DT, {
    columns: cols,
    rows: rows
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(BT, {
    iconLeft: /*#__PURE__*/React.createElement(IC, {
      name: "plus",
      size: 18
    })
  }, "Record reading")));
}
window.MetersScreen = MetersScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ledger/NewEntryScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.StatFigure = __ds_scope.StatFigure;

__ds_ns.DecoBand = __ds_scope.DecoBand;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.NavRail = __ds_scope.NavRail;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

})();
