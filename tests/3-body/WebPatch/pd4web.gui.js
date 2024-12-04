// Copyright (c) 2020 Zack Lee: cuinjune@gmail.com
// GNU General Public License v3.0
// For information on usage and redistribution, and for a DISCLAIMER OF ALL WARRANTIES, see the file, "LICENSE" in this distribution.
// Code From: https://github.com/cuinjune/PdWebParty
//╭─────────────────────────────────────╮
//│            Auto Theming             │
//╰─────────────────────────────────────╯
function GetStyleRuleValue(className, stylesProb) {
    let style = {};
    var el = document.createElement("div");
    el.className = className;
    document.body.appendChild(el);
    var computedStyle = window.getComputedStyle(el);
    for (let prob in stylesProb) {
        let thisProb = stylesProb[prob];
        let value = computedStyle.getPropertyValue(thisProb);
        style[thisProb] = value;
    }
    document.body.removeChild(el);
    return style;
}

// ─────────────────────────────────────
function getCssVariable(variableName) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

// ─────────────────────────────────────
function setSoundIcon(icon, animation) {
    let soundSwitch = document.getElementById("Pd4WebAudioSwitch");

    if (soundSwitch) {
        const soundOffSvg = getComputedStyle(document.documentElement).getPropertyValue(icon).trim();
        const svgData = soundOffSvg.match(/url\("data:image\/svg\+xml;base64,(.*)"\)/)?.[1];
        if (svgData === undefined) {
            window.setTimeout(() => {
                setSoundIcon(icon, animation);
            }, 1000);
            return;
        }

        const svgDecoded = atob(svgData);
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgDecoded, "image/svg+xml");
        const svgElement = svgDoc.querySelector("svg");
        if (svgElement) {
            if (Pd4Web.isMobile) {
                svgElement.setAttribute("width", "48");
                svgElement.setAttribute("height", "48");
            } else {
                svgElement.setAttribute("width", "24");
                svgElement.setAttribute("height", "24");
            }
            svgElement.style.display = "inline-block";
            svgElement.style.animation = animation;
            soundSwitch.innerHTML = "";
            soundSwitch.appendChild(svgElement);
        }
    } else {
        console.error("Pd4WebAudioSwitch not found");
    }
}

// ─────────────────────────────────────
function GetNeededStyles() {
    Pd4Web.Style = {};
    Pd4Web.Style.Bg = getCssVariable("--bg");
    Pd4Web.Style.Fg = getCssVariable("--fg");
    Pd4Web.Style.Sel = getCssVariable("--selected");

    let elements = document.querySelectorAll(".nbx-text");
    for (let element of elements) {
        element.style.fill = getCssVariable("--nbx-text");
    }

    elements = document.querySelectorAll(".key-black");
    for (let element of elements) {
        element.style.fill = getCssVariable("--keyboard-black-key");
    }

    elements = document.querySelectorAll(".key-white");
    for (let element of elements) {
        element.style.fill = getCssVariable("--keyboard-white-key");
    }

    elements = document.querySelectorAll(".vu-mini-rect");
    for (let element of elements) {
        element.style.fill = getCssVariable("--vu-active");
    }
}

// ─────────────────────────────────────
function ThemeListener(_) {
    GetNeededStyles();
}

// ─────────────────────────────────────
function GetRBG(hex) {
    hex = hex.replace(/^#/, "");
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);
    return { r, g, b };
}

// ─────────────────────────────────────
function AlmostWhiteOrBlack(hex) {
    let rgb = GetRBG(hex);
    let almostBlack = rgb.r < 20 && rgb.g < 20 && rgb.b < 20;
    let almostWhite = rgb.r > 235 && rgb.g > 235 && rgb.b > 235;
    return almostBlack || almostWhite;
}

// ─────────────────────────────────────
// Interative listener for the objects
function MessageListener(source, symbol, list) {
    for (const data of Pd4Web.GuiReceivers[source]) {
        switch (data.type) {
            case "bng":
                switch (symbol) {
                    case "size":
                        data.size = list[0] || 8;
                        ConfigureItem(data.rect, GuiBngRect(data));
                        ConfigureItem(data.circle, GuiBngCircle(data));
                        break;
                    case "flashtime":
                        data.interrupt = list[0] || 10;
                        data.hold = list[1] || 50;
                        break;
                    case "init":
                        data.init = list[0];
                        break;
                    case "send":
                        data.send = list[0];
                        break;
                    case "receive":
                        UnbindGuiReceiver(data);
                        data.receive = list[0];
                        BindGuiReceiver(data);
                        break;
                    case "label":
                        data.label = list[0] === "empty" ? "" : list[0];
                        data.text.textContent = data.label;
                        break;
                    case "label_pos":
                        data.x_off = list[0];
                        data.y_off = list[1] || 0;
                        ConfigureItem(data.text, GuiBngText(data));
                        break;
                    case "label_font":
                        data.font = list[0];
                        data.fontsize = list[1] || 0;
                        ConfigureItem(data.text, GuiBngText(data));
                        break;
                    case "color":
                        data.bg_color = list[0];
                        data.fg_color = list[1] || 0;
                        data.label_color = list[2] || 0;
                        ConfigureItem(data.rect, GuiBngRect(data));
                        ConfigureItem(data.text, GuiBngText(data));
                        break;
                    case "pos":
                        data.x_pos = list[0];
                        data.y_pos = list[1] || 0;
                        ConfigureItem(data.rect, GuiBngRect(data));
                        ConfigureItem(data.circle, GuiBngCircle(data));
                        ConfigureItem(data.text, GuiBngText(data));
                        break;
                    case "delta":
                        data.x_pos += list[0];
                        data.y_pos += list[1] || 0;
                        ConfigureItem(data.rect, GuiBngRect(data));
                        ConfigureItem(data.circle, GuiBngCircle(data));
                        ConfigureItem(data.text, GuiBngText(data));
                        break;
                    default:
                        GuiBngUpdateCircle(data);
                }
                break;
            case "tgl":
                switch (symbol) {
                    case "size":
                        data.size = list[0] || 8;
                        ConfigureItem(data.rect, GuiTglRect(data));
                        ConfigureItem(data.cross1, GuiTglCross1(data));
                        ConfigureItem(data.cross2, GuiTglCross2(data));
                        break;
                    case "nonzero":
                        data.default_value = list[0];
                        break;
                    case "init":
                        data.init = list[0];
                        break;
                    case "send":
                        data.send = list[0];
                        break;
                    case "receive":
                        UnbindGuiReceiver(data);
                        data.receive = list[0];
                        BindGuiReceiver(data);
                        break;
                    case "label":
                        data.label = list[0] === "empty" ? "" : list[0];
                        data.text.textContent = data.label;
                        break;
                    case "label_pos":
                        data.x_off = list[0];
                        data.y_off = list[1] || 0;
                        ConfigureItem(data.text, GuiTglText(data));
                        break;
                    case "label_font":
                        data.font = list[0];
                        data.fontsize = list[1] || 0;
                        ConfigureItem(data.text, GuiTglText(data));
                        break;
                    case "color":
                        data.bg_color = list[0];
                        data.fg_color = list[1] || 0;
                        data.label_color = list[2] || 0;
                        ConfigureItem(data.rect, GuiTglRect(data));
                        ConfigureItem(data.cross1, GuiTglCross1(data));
                        ConfigureItem(data.cross2, GuiTglCross2(data));
                        ConfigureItem(data.text, GuiTglText(data));
                        break;
                    case "pos":
                        data.x_pos = list[0];
                        data.y_pos = list[1] || 0;
                        ConfigureItem(data.rect, GuiTglRect(data));
                        ConfigureItem(data.cross1, GuiTglCross1(data));
                        ConfigureItem(data.cross2, GuiTglCross2(data));
                        ConfigureItem(data.text, GuiTglText(data));
                        break;
                    case "delta":
                        data.x_pos += list[0];
                        data.y_pos += list[1] || 0;
                        ConfigureItem(data.rect, GuiTglRect(data));
                        ConfigureItem(data.cross1, GuiTglCross1(data));
                        ConfigureItem(data.cross2, GuiTglCross2(data));
                        ConfigureItem(data.text, GuiTglText(data));
                        break;
                    case "set":
                        data.default_value = list[0];
                        data.value = data.default_value;
                        GuiTglUpdateCross(data);
                        break;
                }
                break;
            case "vsl":
            case "hsl":
                switch (symbol) {
                    case "size":
                        if (list.length === 1) {
                            data.width = list[0] || 8;
                        } else {
                            data.width = list[0] || 8;
                            data.height = list[1] || 2;
                        }
                        ConfigureItem(data.rect, gui_slider_rect(data));
                        ConfigureItem(data.indicator, gui_slider_indicator(data));
                        GuiSliderCheckMinmax(data);
                        break;
                    case "range":
                        data.bottom = list[0];
                        data.top = list[1] || 0;
                        GuiSliderCheckMinmax(data);
                        break;
                    case "lin":
                        data.log = 0;
                        GuiSliderCheckMinmax(data);
                        break;
                    case "log":
                        data.log = 1;
                        GuiSliderCheckMinmax(data);
                        break;
                    case "init":
                        data.init = list[0];
                        break;
                    case "steady":
                        data.steady_on_click = list[0];
                        break;
                    case "send":
                        data.send = list[0];
                        break;
                    case "receive":
                        UnbindGuiReceiver(data);
                        data.receive = list[0];
                        BindGuiReceiver(data);
                        break;
                    case "label":
                        data.label = list[0] === "empty" ? "" : list[0];
                        data.text.textContent = data.label;
                        break;
                    case "label_pos":
                        data.x_off = list[0];
                        data.y_off = list[1] || 0;
                        ConfigureItem(data.text, gui_slider_text(data));
                        break;
                    case "label_font":
                        data.font = list[0];
                        data.fontsize = list[1] || 0;
                        ConfigureItem(data.text, gui_slider_text(data));
                        break;
                    case "color":
                        data.bg_color = list[0];
                        data.fg_color = list[1] || 0;
                        data.label_color = list[2] || 0;
                        ConfigureItem(data.rect, gui_slider_rect(data));
                        ConfigureItem(data.indicator, gui_slider_indicator(data));
                        ConfigureItem(data.text, gui_slider_text(data));
                        break;
                    case "pos":
                        data.x_pos = list[0];
                        data.y_pos = list[1] || 0;
                        ConfigureItem(data.rect, gui_slider_rect(data));
                        ConfigureItem(data.indicator, gui_slider_indicator(data));
                        ConfigureItem(data.text, gui_slider_text(data));
                        break;
                    case "delta":
                        data.x_pos += list[0];
                        data.y_pos += list[1] || 0;
                        ConfigureItem(data.rect, gui_slider_rect(data));
                        ConfigureItem(data.indicator, gui_slider_indicator(data));
                        ConfigureItem(data.text, gui_slider_text(data));
                        break;
                    case "set":
                        GuiSliderSet(data, list[0]);
                        break;
                }
                break;
            case "vradio":
            case "hradio":
                switch (symbol) {
                    case "size":
                        data.size = list[0] || 8;
                        ConfigureItem(data.rect, GuiRadioRect(data));
                        GuiRadioUpdateLinesButtons(data);
                        break;
                    case "init":
                        data.init = list[0];
                        break;
                    case "number":
                        const n = Math.min(Math.max(Math.floor(list[0]), 1), 128);
                        if (n !== data.number) {
                            data.number = n;
                            if (data.value >= data.number) {
                                data.value = data.number - 1;
                            }
                            ConfigureItem(data.rect, GuiRadioRect(data));
                            GuiRadioRemoveLinesButtons(data);
                            GuiRadioCreateLinesButtons(data);
                        }
                        break;
                    case "send":
                        data.send = list[0];
                        break;
                    case "receive":
                        UnbindGuiReceiver(data);
                        data.receive = list[0];
                        BindGuiReceiver(data);
                        break;
                    case "label":
                        data.label = list[0] === "empty" ? "" : list[0];
                        data.text.textContent = data.label;
                        break;
                    case "label_pos":
                        data.x_off = list[0];
                        data.y_off = list[1] || 0;
                        ConfigureItem(data.text, GuiRadioText(data));
                        break;
                    case "label_font":
                        data.font = list[0];
                        data.fontsize = list[1] || 0;
                        ConfigureItem(data.text, GuiRadioText(data));
                        break;
                    case "color":
                        data.bg_color = list[0];
                        data.fg_color = list[1] || 0;
                        data.label_color = list[2] || 0;
                        ConfigureItem(data.rect, GuiRadioRect(data));
                        GuiRadioUpdateLinesButtons(data);
                        ConfigureItem(data.text, GuiRadioText(data));
                        break;
                    case "pos":
                        data.x_pos = list[0];
                        data.y_pos = list[1] || 0;
                        ConfigureItem(data.rect, GuiRadioRect(data));
                        GuiRadioUpdateLinesButtons(data);
                        ConfigureItem(data.text, GuiRadioText(data));
                        break;
                    case "delta":
                        data.x_pos += list[0];
                        data.y_pos += list[1] || 0;
                        ConfigureItem(data.rect, GuiRadioRect(data));
                        GuiRadioUpdateLinesButtons(data);
                        ConfigureItem(data.text, GuiRadioText(data));
                        break;
                    case "set":
                        data.value = Math.min(Math.max(Math.floor(list[0]), 0), data.number - 1);
                        GuiRadioUpdateButton(data);
                        break;
                }
                break;
            case "cnv":
                switch (symbol) {
                    case "size":
                        data.size = list[0] || 1;
                        ConfigureItem(data.selectable_rect, GuiCnvSelectableRect(data));
                        break;
                    case "vis_size":
                        if (list.length === 1) {
                            data.width = list[0] || 1;
                            data.height = data.width;
                        } else {
                            data.width = list[0] || 1;
                            data.height = list[1] || 1;
                        }
                        ConfigureItem(data.visible_rect, GuiCnvVisibleRect(data));
                        break;
                    case "send":
                        data.send = list[0];
                        break;
                    case "receive":
                        UnbindGuiReceiver(data);
                        data.receive = list[0];
                        BindGuiReceiver(data);
                        break;
                    case "label":
                        data.label = list[0] === "empty" ? "" : list[0];
                        data.text.textContent = data.label;
                        break;
                    case "label_pos":
                        data.x_off = list[0];
                        data.y_off = list[1] || 0;
                        ConfigureItem(data.text, GuiCnvText(data));
                        break;
                    case "label_font":
                        data.font = list[0];
                        data.fontsize = list[1] || 0;
                        ConfigureItem(data.text, GuiCnvText(data));
                        break;
                    case "get_pos":
                        break;
                    case "color":
                        data.bg_color = list[0];
                        data.label_color = list[1] || 0;
                        ConfigureItem(data.visible_rect, GuiCnvVisibleRect(data));
                        ConfigureItem(data.selectable_rect, GuiCnvSelectableRect(data));
                        ConfigureItem(data.text, GuiCnvText(data));
                        break;
                    case "pos":
                        data.x_pos = list[0];
                        data.y_pos = list[1] || 0;
                        ConfigureItem(data.visible_rect, GuiCnvVisibleRect(data));
                        ConfigureItem(data.selectable_rect, GuiCnvSelectableRect(data));
                        ConfigureItem(data.text, GuiCnvText(data));
                        break;
                    case "delta":
                        data.x_pos += list[0];
                        data.y_pos += list[1] || 0;
                        ConfigureItem(data.visible_rect, GuiCnvVisibleRect(data));
                        ConfigureItem(data.selectable_rect, GuiCnvSelectableRect(data));
                        ConfigureItem(data.text, GuiCnvText(data));
                        break;
                }
                break;
        }
    }
}

//╭─────────────────────────────────────╮
//│            Gui Handling             │
//╰─────────────────────────────────────╯
function CreateItem(type, args) {
    var item = document.createElementNS("http://www.w3.org/2000/svg", type);
    if (args !== null) {
        ConfigureItem(item, args);
    }
    Pd4Web.Canvas.appendChild(item);
    return item;
}

// ─────────────────────────────────────
function ConfigureItem(item, attributes) {
    var value, i, attr;
    if (Array.isArray(attributes)) {
        for (i = 0; i < attributes.length; i += 2) {
            value = attributes[i + 1];
            item.setAttributeNS(null, attributes[i], Array.isArray(value) ? value.join(" ") : value);
        }
    } else {
        for (attr in attributes) {
            if (attributes.hasOwnProperty(attr)) {
                if (item) {
                    item.setAttributeNS(null, attr, attributes[attr]);
                }
            }
        }
    }
}

// ─────────────────────────────────────
function IEMFontFamily(font) {
    let family = "";
    if (font === 1) {
        family = "'Helvetica', 'DejaVu Sans', 'sans-serif'";
    } else if (font === 2) {
        family = "'Times New Roman', 'DejaVu Serif', 'FreeSerif', 'serif'";
    } else {
        family = "'DejaVu Sans Mono', 'monospace'";
    }
    return family;
}

// ─────────────────────────────────────
function ColFromLoad(col) {
    // decimal to hex color
    if (typeof col === "string") {
        return col;
    }
    col = -1 - col;
    col = ((col & 0x3f000) << 6) | ((col & 0xfc0) << 4) | ((col & 0x3f) << 2);
    return "#" + ("000000" + col.toString(16)).slice(-6);
}

//╭─────────────────────────────────────╮
//│          Binder Receivers           │
//╰─────────────────────────────────────╯
function BindGuiReceiver(data) {
    if (data.receive in Pd4Web.GuiReceivers) {
        Pd4Web.GuiReceivers[data.receive].push(data);
    } else {
        Pd4Web.GuiReceivers[data.receive] = [data];
    }

    if (Pd4Web) {
        Pd4Web.addGuiReceiver(data.receive);
    } else {
        alert("Pd4Web not found, please report");
    }
}

// ─────────────────────────────────────
function UnbindGuiReceiver(data) {
    if (data.receive in Pd4Web.GuiReceivers) {
        const len = Pd4Web.GuiReceivers[data.receive].length;
        for (let i = 0; i < len; i++) {
            if (Pd4Web.GuiReceivers[data.receive][i].id === data.id) {
                Pd4Web.unbindReceiver(data.receive);
                Pd4Web.GuiReceivers[data.receive].splice(i, 1);
                if (!Pd4Web.GuiReceivers[data.receive].length) {
                    delete Pd4Web.GuiReceivers[data.receive];
                }
                break;
            }
        }
    }
}

// ─────────────────────────────────────
function GuiRect(data) {
    let rect = {
        x: data.x_pos,
        y: data.y_pos,
        rx: 2,
        ry: 2,
        width: data.size,
        height: data.size,
        id: `${data.id}_rect`,
        class: "border clickable",
    };
    if (!Pd4Web.AutoTheme) {
        rect.fill = ColFromLoad(data.bg_color);
    }
    return rect;
}

// ─────────────────────────────────────
function GuiText(data) {
    let color;
    let text = {
        x: data.x_pos + data.x_off,
        y: data.y_pos + data.y_off,
        "font-family": IEMFontFamily(data.font),
        "font-weight": "normal",
        "font-size": `${data.fontsize}px`,
        transform: `translate(0, ${(data.fontsize / 2) * 0.6})`, // note: modified
        id: `${data.id}_text`,
        class: "unclickable",
    };
    if (!Pd4Web.AutoTheme) {
        text.fill = ColFromLoad(data.label_color);
    }
}

// ─────────────────────────────────────
function GuiMousePoint(e) {
    let point = Pd4Web.Canvas.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    point = point.matrixTransform(Pd4Web.Canvas.getScreenCTM().inverse());
    return point;
}

//╭─────────────────────────────────────╮
//│              Bang: Bng              │
//╰─────────────────────────────────────╯
function GuiBngRect(data) {
    let rect = {
        x: data.x_pos,
        y: data.y_pos,
        rx: 2,
        ry: 2,
        width: data.size,
        height: data.size,
        id: `${data.id}_rect`,
        class: "border bng-rect clickable",
    };
    if (!Pd4Web.AutoTheme) {
        rect.fill = ColFromLoad(data.bg_color);
    }
    return rect;
}

// ─────────────────────────────────────
function GuiBngCircle(data) {
    const r = (data.size - 2) / 2;
    const cx = data.x_pos + r + 1;
    const cy = data.y_pos + r + 1;
    return {
        cx: cx,
        cy: cy,
        r: r,
        fill: "transparent",
        id: `${data.id}_circle`,
        class: "unclickable border",
    };
}

// ─────────────────────────────────────
function GuiBngText(data) {
    return GuiText(data);
}

// ─────────────────────────────────────
function GuiBngUpdateCircle(data) {
    let color;
    if (Pd4Web.AutoTheme) {
        color = ColFromLoad(getCssVariable("--bng-circle"));
    } else {
        color = data.fg_color;
    }

    if (data.flashed) {
        data.flashed = false;
        ConfigureItem(data.circle, {
            fill: color,
        });
        if (data.interrupt_timer) {
            clearTimeout(data.interrupt_timer);
        }
        data.interrupt_timer = setTimeout(function () {
            data.interrupt_timer = null;
            ConfigureItem(data.circle, {
                fill: color,
            });
        }, data.interrupt);
        data.flashed = true;
    } else {
        data.flashed = true;
        ConfigureItem(data.circle, {
            fill: color,
        });
    }

    //

    if (data.hold_timer) {
        clearTimeout(data.hold_timer);
    }
    data.hold_timer = setTimeout(function () {
        data.flashed = false;
        data.hold_timer = null;
        ConfigureItem(data.circle, {
            fill: "transparent",
        });
    }, data.hold);
}

// ─────────────────────────────────────
function GuiBngOnMouseDown(data) {
    GuiBngUpdateCircle(data);
    Pd4Web.sendBang(data.send);
}

// ─────────────────────────────────────
function GuiBngSetup(args, id) {
    const data = {};
    data.x_pos = parseInt(args[2]) - Pd4Web.x_pos;
    data.y_pos = parseInt(args[3]) - Pd4Web.y_pos;
    data.type = args[4];
    data.size = parseInt(args[5]);
    data.hold = parseInt(args[6]);
    data.interrupt = parseInt(args[7]);
    data.init = parseInt(args[8]);
    data.send = args[9];
    data.receive = args[10];
    data.label = args[11] === "empty" ? "" : args[11];
    data.x_off = parseInt(args[12]);
    data.y_off = parseInt(args[13]);
    data.font = parseInt(args[14]);
    data.fontsize = parseInt(args[15]);
    data.bg_color = isNaN(args[16]) ? args[16] : parseInt(args[16]);
    data.fg_color = isNaN(args[17]) ? args[17] : parseInt(args[17]);
    data.label_color = isNaN(args[18]) ? args[18] : parseInt(args[18]);
    data.id = `${data.type}_${id++}`;

    // create svg
    data.rect = CreateItem("rect", GuiBngRect(data));
    data.circle = CreateItem("circle", GuiBngCircle(data));
    data.text = CreateItem("text", GuiBngText(data));
    data.text.textContent = data.label;

    // handle event
    data.flashed = false;
    data.interrupt_timer = null;
    data.hold_timer = null;
    if (Pd4Web.isMobile) {
        data.rect.addEventListener("touchstart", function () {
            GuiBngOnMouseDown(data);
        });
    } else {
        data.rect.addEventListener("mousedown", function () {
            GuiBngOnMouseDown(data);
        });
    }
    // subscribe receiver
    BindGuiReceiver(data);
}

//╭─────────────────────────────────────╮
//│             Toggle: Tgl             │
//╰─────────────────────────────────────╯
function GuiTglRect(data) {
    let rect = {
        x: data.x_pos,
        y: data.y_pos,
        rx: 2,
        ry: 2,
        width: data.size,
        height: data.size,
        id: `${data.id}_rect`,
        class: "border tgl-rect clickable",
    };
    if (!Pd4Web.AutoTheme) {
        rect.fill = ColFromLoad(data.bg_color);
    }
    return rect;
}

// ─────────────────────────────────────
function GuiTglCross1(data) {
    const w = ((data.size + 29) / 30) * 0.75; // note: modified
    const x1 = data.x_pos;
    const y1 = data.y_pos;
    const x2 = x1 + data.size;
    const y2 = y1 + data.size;
    const p1 = x1 + w + 1;
    const p2 = y1 + w + 1;
    const p3 = x2 - w - 1;
    const p4 = y2 - w - 1;
    const points = [p1, p2, p3, p4].join(" ");
    let cross1 = {
        points: points,
        "stroke-width": w,
        stroke: getCssVariable("--fg2"),
        id: `${data.id}_cross1`,
        class: "unclickable tgl-cross",
    };
    if (!Pd4Web.AutoTheme) {
        //cross1.fill = "none";
    }
    return cross1;
}

// ─────────────────────────────────────
function GuiTglCross2(data) {
    const w = ((data.size + 29) / 30) * 0.75; // note: modified
    const x1 = data.x_pos;
    const y1 = data.y_pos;
    const x2 = x1 + data.size;
    const y2 = y1 + data.size;
    const p1 = x1 + w + 1;
    const p2 = y2 - w - 1;
    const p3 = x2 - w - 1;
    const p4 = y1 + w + 1;
    const points = [p1, p2, p3, p4].join(" ");
    let cross2 = {
        points: points,
        "stroke-width": w,
        stroke: getCssVariable("--fg2"),
        id: `${data.id}_cross1`,
        class: "unclickable tgl-cross",
    };
    if (!Pd4Web.AutoTheme) {
        cross2.fill = ColFromLoad(data.fg_color);
    }
    return cross2;
}

// ─────────────────────────────────────
function GuiTglText(data) {
    return GuiText(data);
}

// ─────────────────────────────────────
function GuiTglUpdateCross(data) {
    let colorOn;
    let colorOff = getCssVariable("--fg2");
    if (!Pd4Web.AutoTheme) {
        colorOn = ColFromLoad(data.fg_color);
    } else {
        colorOn = getCssVariable("--tgl-cross");
    }

    ConfigureItem(data.cross1, {
        stroke: data.value ? colorOn : colorOff,
    });
    ConfigureItem(data.cross2, {
        stroke: data.value ? colorOn : colorOff,
    });
}

// ─────────────────────────────────────
function GuiTglOnMouseDown(data) {
    data.value = data.value ? 0 : data.default_value;
    GuiTglUpdateCross(data);
    Pd4Web.sendFloat(data.send, data.value);
}

// ─────────────────────────────────────
function GuiTglSetup(args, id) {
    const data = {};
    data.x_pos = parseInt(args[2]) - Pd4Web.x_pos;
    data.y_pos = parseInt(args[3]) - Pd4Web.y_pos;
    data.type = args[4];
    data.size = parseInt(args[5]);
    data.init = parseInt(args[6]);
    data.send = args[7];
    data.receive = args[8];
    data.label = args[9] === "empty" ? "" : args[9];
    data.x_off = parseInt(args[10]);
    data.y_off = parseInt(args[11]);
    data.font = parseInt(args[12]);
    data.fontsize = parseInt(args[13]);
    data.bg_color = isNaN(args[14]) ? args[14] : parseInt(args[14]);
    data.fg_color = isNaN(args[15]) ? args[15] : parseInt(args[15]);
    data.label_color = isNaN(args[16]) ? args[16] : parseInt(args[16]);
    data.init_value = parseFloat(args[17]);
    data.default_value = parseFloat(args[18]);
    data.value = data.init && data.init_value ? data.default_value : 0;
    data.id = `${data.type}_${id++}`;

    // create svg
    data.rect = CreateItem("rect", GuiTglRect(data));
    data.cross1 = CreateItem("polyline", GuiTglCross1(data));
    data.cross2 = CreateItem("polyline", GuiTglCross2(data));
    data.text = CreateItem("text", GuiTglText(data));
    data.text.textContent = data.label;

    // handle event
    if (Pd4Web.isMobile) {
        data.rect.addEventListener("touchstart", function () {
            GuiTglOnMouseDown(data);
        });
    } else {
        data.rect.addEventListener("mousedown", function () {
            GuiTglOnMouseDown(data);
        });
    }
    BindGuiReceiver(data);
}

//╭─────────────────────────────────────╮
//│             Number: Nbx             │
//╰─────────────────────────────────────╯
function GuiNbxUpdateNumber(data, f) {
    const txt = document.getElementById(`${data.id}_text`); // Find the associated text element
    var text = f;
    txt.numberCotent = f;
    if (text.length >= data.width) {
        // remove olds > and add new one
        for (var i = 0; i < data.width; i++) {
            if (text[i] == ">") {
                text = text.slice(0, i) + text.slice(i + 1);
                break;
            }
        }
        text = text.slice(-data.width + 1) + ">";
        txt.textContent = text;
    } else {
        txt.textContent = text;
    }
}

// ─────────────────────────────────────
function GuiNbxKeyDownListener(e) {
    const data = Pd4Web.NbxSelected; // Get the currently selected SVG element
    const txt = document.getElementById(`${data.id}_text`); // Find the associated text element
    const key = e.key; // Get the key that was pressed

    // TODO: Need to implement e numbers
    // check if key is between 0-9 or . or + and i
    if (key >= "0" && key <= "9") {
    } else if (key === ".") {
    } else if ((key === "+") | (key === "-")) {
    } else if (key == "Enter") {
        let textColor;
        if (Pd4Web.AutoTheme) {
            textColor = getCssVariable("--nbx-text");
        } else {
            textColor = ColFromLoad(data.label_color);
        }
        txt.style.fill = textColor;
        txt.clicked = false;
        const svgElement = document.getElementById("Pd4WebCanvas");
        svgElement.removeAttribute("tabindex"); // Remove tabindex
        Pd4Web.NbxSelected = null;
        svgElement.removeEventListener("keypress", GuiNbxKeyDownListener);
        if (txt.numberCotent.length > data.width) {
            txt.textContent = "+";
        } else {
            txt.textContent = txt.numberCotent;
        }
        Pd4Web.sendFloat(data.send, parseFloat(txt.numberCotent));
        return;
    } else {
        return;
    }

    if (txt) {
        if (data.inputCnt == 0) {
            txt.textContent = key; // Update the text content of the SVG text element
            txt.numberCotent = key;
        } else {
            var text = txt.textContent + key;
            txt.numberCotent += key;
            if (text.length >= data.width) {
                // remove olds > and add new one
                for (var i = 0; i < data.width; i++) {
                    if (text[i] == ">") {
                        text = text.slice(0, i) + text.slice(i + 1);
                        break;
                    }
                }
                text = text.slice(-data.width + 1) + ">";
                txt.textContent = text;
            } else {
                txt.textContent = txt.textContent + key;
            }
        }
        data.inputCnt++;
    } else {
        console.error(`Text element with id ${data.id}_text not found.`);
    }
}

// ─────────────────────────────────────
function GuiNbxRect(data) {
    return {
        x: data.x_pos,
        y: data.y_pos,
        width: data.width * data.fontsize,
        height: data.height,
        rx: 2,
        ry: 2,
        id: `${data.id}_rect`,
        fill: "transparent",
        "stroke-width": "1px",
        class: "border clickable nbx",
    };
}

// ─────────────────────────────────────
// Draw the small triangle (for up/down control)
function GuiNbxTriangle(data) {
    const height = data.height;
    const tri_size = height * 0.3; // Size of the triangle

    const gap = 1.5; // Gap between the triangle and the
    const x1 = data.x_pos + gap; // Adjust the triangle position to the left of the box
    const y1 = data.y_pos + gap;

    const x2 = x1; // Same x for the bottom left corner of the triangle
    const y2 = data.y_pos + data.height - gap;

    const x3 = x1 + tri_size;
    const y3 = data.y_pos + data.height / 2;

    return {
        points: `${x1},${y1} ${x3},${y3} ${x2},${y2}, ${x3},${y3}`,
        "stroke-width": "1px",
        id: `${data.id}_triangle`,
        class: "unclickable border",
    };
}

// ─────────────────────────────────────
// Draw the number text inside the nbx
function GuiNbxText(data) {
    const start_text = data.height * 0.5; // Size of the triangle
    let textColor;
    if (Pd4Web.AutoTheme) {
        textColor = Pd4Web.Style.Text;
    } else {
        textColor = ColFromLoad(data.label_color);
    }
    return {
        x: data.x_pos + start_text, // Adjust the x position to center the text in the box
        y: data.y_pos + data.height / 2 + data.fontsize * 0.4, // Center the text vertically
        rx: 1,
        ry: 2,
        "font-family": IEMFontFamily(data.font), // Use the specified font family
        "font-weight": "bold", // Use bold text to match Pd number box style
        "font-size": `${data.fontsize}px`, // Set font size
        fill: textColor, // Set the color from data
        "text-anchor": "left", // Center the text horizontally
        id: `${data.id}_text`,
        clicked: false,
        class: "unclickable nbx-text",
    };
}

// ─────────────────────────────────────
function GuiNbxSetup(args, id) {
    const data = {};
    data.x_pos = parseInt(args[2]) - Pd4Web.x_pos;
    data.y_pos = parseInt(args[3]) - Pd4Web.y_pos;
    data.type = args[4];
    data.width = parseInt(args[5]);
    data.height = parseInt(args[6]);
    data.bottom = parseInt(args[7]);
    data.top = parseInt(args[8]);
    data.log = parseInt(args[9]);
    data.init = parseInt(args[10]);
    data.send = args[11];
    data.receive = args[12];
    data.label = args[13] === "empty" ? "" : args[13];
    data.x_off = parseInt(args[14]);
    data.y_off = parseInt(args[15]);
    data.font = parseInt(args[16]);
    data.fontsize = parseInt(args[17]);
    data.bg_color = isNaN(args[18]) ? args[18] : parseInt(args[18]);
    data.fg_color = isNaN(args[19]) ? args[19] : parseInt(args[19]);
    data.label_color = isNaN(args[20]) ? args[20] : parseInt(args[20]);
    data.default_value = parseFloat(args[21]);
    data.log_height = parseFloat(args[22]);
    data.value = data.init ? data.default_value : 0;
    data.id = `${data.type}_${id++}`;

    data.rect = CreateItem("rect", GuiNbxRect(data));
    data.triangle = CreateItem("polygon", GuiNbxTriangle(data));
    data.numbers = CreateItem("text", GuiNbxText(data));
    data.numbers.textContent = data.init;

    if (Pd4Web.isMobile) {
        data.rect.addEventListener("touchstart", function (e) {
            for (const _ of e.changedTouches) {
                // Call your function here
                // gui_slider_onmousedown(data, touch, touch.identifier);
            }
        });
    } else {
        data.rect.addEventListener("click", function (_) {
            const id = data.id + "_text";
            const txt = document.getElementById(id);
            if (txt.clicked) {
                let textColor;
                if (Pd4Web.AutoTheme) {
                    textColor = getCssVariable("--nbx-text-selected");
                } else {
                    textColor = ColFromLoad(data.label_color);
                }
                console.log(textColor);
                txt.style.fill = textColor; // Change fill color to black
                txt.clicked = false;
                const svgElement = document.getElementById("Pd4WebCanvas");
                svgElement.removeAttribute("tabindex"); // Remove tabindex
                Pd4Web.NbxSelected = null;
                svgElement.removeEventListener("keypress", GuiNbxKeyDownListener);
                if (txt.numberCotent.length > data.width) {
                    txt.textContent = "+";
                } else {
                    txt.textContent = txt.numberCotent;
                }
                Pd4Web.sendFloat(data.send, parseFloat(txt.numberCotent));
            } else {
                txt.style.fill = getCssVariable("--nbx-selected"); // Change fill color to black
                txt.clicked = true;
                const svgElement = document.getElementById("Pd4WebCanvas");
                svgElement.setAttribute("tabindex", "0"); // "0" makes it focusable
                svgElement.focus();
                data.inputCnt = 0;
                Pd4Web.NbxSelected = data;
                svgElement.addEventListener("keypress", GuiNbxKeyDownListener);
            }
        });
    }
    BindGuiReceiver(data);
}

//╭─────────────────────────────────────╮
//│           Slider: vsl/hsl           │
//╰─────────────────────────────────────╯
function GuiSliderRect(data) {
    let x = data.x_pos;
    let y = data.y_pos;
    let color = ColFromLoad(data.bg_color);
    let width = data.width;
    let height = data.height;
    if (Pd4Web.AutoTheme) {
        return {
            x: x,
            y: y,
            rx: 2,
            ry: 2,
            width: width,
            height: height,
            id: `${data.id}_rect`,
            class: "border clickable slider-fill",
        };
    } else {
        return {
            x: x,
            y: y,
            rx: 2,
            ry: 2,
            width: width,
            height: height,
            //fill: color,
            id: `${data.id}_rect`,
            class: "border clickable",
        };
    }
}

// ─────────────────────────────────────
function GuiSliderIndicatorPoints(data) {
    let x1 = data.x_pos;
    let y1 = data.y_pos;
    let x2 = x1 + data.width;
    let y2 = y1 + data.height;
    let r = 0;
    let p1 = 0;
    let p2 = 0;
    let p3 = 0;
    let p4 = 0;
    if (data.type === "vsl") {
        r = y2 - 3 - (data.value + 50) / 100;
        r = Math.max(y1 + 3, Math.min(r, y2 - 3));
        p1 = x1 + 2;
        p2 = r;
        p3 = x2 - 2;
        p4 = r;
    } else {
        r = x1 + 3 + (data.value + 50) / 100;
        r = Math.max(x1 + 3, Math.min(r, x2 - 3));
        p1 = r;
        p2 = y1 + 2;
        p3 = r;
        p4 = y2 - 2;
    }
    return {
        x1: p1,
        y1: p2,
        x2: p3,
        y2: p4,
    };
}

// ─────────────────────────────────────
function GuiSliderIndicator(data) {
    const p = GuiSliderIndicatorPoints(data);
    let rgb = GetRBG(data.fg_color);

    if (!Pd4Web.AutoTheme) {
        return {
            x1: p.x1,
            y1: p.y1,
            x2: p.x2,
            y2: p.y2,
            stroke: ColFromLoad(data.fg_color),
            "stroke-linecap": "round",
            fill: "none",
            id: `${data.id}_indicator`,
            class: "unclickable slider-indicator",
        };
    } else {
        let almostBlack = rgb.r < 20 && rgb.g < 20 && rgb.b < 20;
        let almostWhite = rgb.r > 235 && rgb.g > 235 && rgb.b > 235;
        if (almostBlack || almostWhite) {
            return {
                x1: p.x1,
                y1: p.y1,
                x2: p.x2,
                y2: p.y2,
                rx: 2,
                ry: 2,
                "stroke-linecap": "round",
                stroke: ColFromLoad(data.fg_color),
                fill: "none",
                id: `${data.id}_indicator`,
                class: "unclickable slider-indicator",
            };
        }
        return {
            x1: p.x1,
            y1: p.y1,
            x2: p.x2,
            y2: p.y2,
            rx: 2,
            ry: 2,
            stroke: ColFromLoad(data.fg_color),
            "stroke-width": 3,
            "stroke-linecap": "round",
            fill: "none",
            id: `${data.id}_indicator`,
            class: "unclickable",
        };
    }
}

// ─────────────────────────────────────
function GuiSliderText(data) {
    return GuiText(data);
}

// ─────────────────────────────────────
function GuiSliderUpdateIndicatorRect(data) {
    const p = GuiSliderIndicatorPoints(data);
    ConfigureItem(data.indicator, {
        x1: p.x1,
        y1: p.y1,
        x2: p.x2,
        y2: p.y2,
    });
}

// ─────────────────────────────────────
function GuiSliderUpdateIndicator(data) {
    const p = GuiSliderIndicatorPoints(data);
    ConfigureItem(data.indicator, {
        x1: p.x1,
        y1: p.y1,
        x2: p.x2,
        y2: p.y2,
        class: "unclickable slider-indicator",
    });
}

// slider events

// ─────────────────────────────────────
function GuiSliderCheckMinMax(data) {
    if (data.log) {
        if (!data.bottom && !data.top) {
            data.top = 1;
        }
        if (data.top > 0) {
            if (data.bottom <= 0) {
                data.bottom = 0.01 * data.top;
            }
        } else {
            if (data.bottom > 0) {
                data.top = 0.01 * data.bottom;
            }
        }
    }
    data.reverse = data.bottom > data.top;
    const w = data.type === "vsl" ? data.height : data.width;
    if (data.log) {
        data.k = Math.log(data.top / data.bottom) / (w - 1);
    } else {
        data.k = (data.top - data.bottom) / (w - 1);
    }
}

// ─────────────────────────────────────
function GuiSliderSet(data, f) {
    let g = 0;

    if (data.reverse) {
        f = Math.max(Math.min(f, data.bottom), data.top);
    } else {
        f = Math.max(Math.min(f, data.top), data.bottom);
    }

    if (data.log) {
        g = Math.log(f / data.bottom) / data.k;
    } else {
        g = (f - data.bottom) / data.k;
    }

    data.value = 100 * g + 0.49999;
    GuiSliderUpdateIndicator(data);
}

// ─────────────────────────────────────
function GuiSliderBang(data) {
    let out = 0;
    if (data.log) {
        out = data.bottom * Math.exp(data.k * data.value * 0.01);
    } else {
        out = data.value * 0.01 * data.k + data.bottom;
    }
    if (data.reverse) {
        out = Math.max(Math.min(out, data.bottom), data.top);
    } else {
        out = Math.max(Math.min(out, data.top), data.bottom);
    }
    if (out < 1.0e-10 && out > -1.0e-10) {
        out = 0;
    }

    if (Pd4Web) {
        Pd4Web.sendFloat(data.send, out);
    }
}

// ─────────────────────────────────────
function GuiSliderOnMouseDown(data, e, id) {
    const p = GuiMousePoint(e);
    if (!data.steady_on_click) {
        if (data.type === "vsl") {
            data.value = Math.max(Math.min(100 * (data.height + data.y_pos - p.y), (data.height - 50) * 100), 0);
        } else {
            data.value = Math.max(Math.min(100 * (p.x - data.x_pos), (data.width - 1) * 100), 0);
        }
        GuiSliderUpdateIndicator(data);
    }
    GuiSliderBang(data);
    Pd4Web.Touches[id] = {
        data: data,
        point: p,
        value: data.value,
    };
}

// ─────────────────────────────────────
function GuiSliderOnMouseMove(e, id) {
    if (id in Pd4Web.Touches) {
        const { data, point, value } = Pd4Web.Touches[id];
        const p = GuiMousePoint(e);
        if (data.type === "vsl") {
            data.value = Math.max(Math.min(value + (point.y - p.y) * 100, (data.height - 1) * 100), 0);
        } else {
            data.value = Math.max(Math.min(value + (p.x - point.x) * 100, (data.width - 1) * 100), 0);
        }
        if (Pd4Web.isMobile) {
            document.body.style.overflow = "hidden";
        }
        GuiSliderUpdateIndicator(data);
        GuiSliderBang(data);
    }
}

// ─────────────────────────────────────
function GuiSliderOnMouseUp(id) {
    if (id in Pd4Web.Touches) {
        delete Pd4Web.Touches[id];
    }

    if (Pd4Web.isMobile) {
        document.body.style.overflow = "auto";
    }
}

// ─────────────────────────────────────
function GuiSliderSetup(args, id) {
    const data = {};
    data.type = args[4];

    if (data.type == "hsl") {
        data.x_pos = parseInt(args[2]) - 3 - Pd4Web.x_pos;
    } else {
        data.x_pos = parseInt(args[2]) - Pd4Web.x_pos;
    }

    if (data.type == "vsl") {
        data.y_pos = parseInt(args[3]) - 2 - Pd4Web.y_pos;
    } else {
        data.y_pos = parseInt(args[3]) - Pd4Web.y_pos;
    }
    data.width = parseInt(args[5]);
    data.height = parseInt(args[6]);
    data.bottom = parseInt(args[7]);
    data.top = parseInt(args[8]);
    data.log = parseInt(args[9]);
    data.init = parseInt(args[10]);
    data.send = args[11];
    data.receive = args[12];
    data.label = args[13] === "empty" ? "" : args[13];
    data.x_off = parseInt(args[14]);
    data.y_off = parseInt(args[15]);
    data.font = parseInt(args[16]);
    data.fontsize = parseInt(args[17]);
    data.bg_color = isNaN(args[18]) ? args[18] : parseInt(args[18]);
    data.fg_color = isNaN(args[19]) ? args[19] : parseInt(args[19]);
    data.label_color = isNaN(args[20]) ? args[20] : parseInt(args[20]);
    data.default_value = parseFloat(args[21]);
    data.steady_on_click = parseFloat(args[22]);
    data.value = data.init ? data.default_value : 0;
    data.id = `${data.type}_${id++}`;

    // create svg
    data.rect = CreateItem("rect", GuiSliderRect(data));
    data.indicator = CreateItem("line", GuiSliderIndicator(data));
    data.text = CreateItem("text", GuiSliderText(data));
    data.text.textContent = data.label;

    // handle event
    GuiSliderCheckMinMax(data);
    if (Pd4Web.isMobile) {
        data.rect.addEventListener("touchstart", function (e) {
            for (const touch of e.changedTouches) {
                GuiSliderOnMouseDown(data, touch, touch.identifier);
            }
        });
    } else {
        data.rect.addEventListener("mousedown", function (e) {
            GuiSliderOnMouseDown(data, e, 0);
        });
    }
    // subscribe receiver
    BindGuiReceiver(data);
}

//╭─────────────────────────────────────╮
//│        Radio: vradio/hradio         │
//╰─────────────────────────────────────╯
function GuiRadioRect(data) {
    let width = data.size;
    let height = data.size;
    if (data.type === "vradio") {
        height *= data.number;
    } else {
        width *= data.number;
    }
    let radio = {
        x: data.x_pos,
        y: data.y_pos,
        rx: 2,
        ry: 2,
        width: width,
        height: height,
        id: `${data.id}_rect`,
        class: "border clickable radio",
    };
    return radio;
}

// ─────────────────────────────────────
function GuiRadioLine(data, p1, p2, p3, p4, button_index) {
    return {
        x1: p1,
        y1: p2,
        x2: p3,
        y2: p4,
        id: `${data.id}_line_${button_index}`,
        class: "border unclickable",
    };
}

// ─────────────────────────────────────
function GuiRadioButton(data, p1, p2, p3, p4, button_index, state) {
    return {
        x: p1,
        y: p2,
        rx: 0.5,
        ry: 0.5,
        width: p3 - p1,
        height: p4 - p2,
        fill: ColFromLoad(data.fg_color),
        stroke: ColFromLoad(data.fg_color),
        display: state ? "inline" : "none",
        id: `${data.id}_button_${button_index}`,
        class: "radio-buttom unclickable",
    };
}

// ─────────────────────────────────────
function GuiRadioRemoveLinesButtons(data) {
    for (const line of data.lines) {
        line.parentNode.removeChild(line);
    }
    for (const button of data.buttons) {
        button.parentNode.removeChild(button);
    }
}

// ─────────────────────────────────────
function GuiRadioLinesButtons(data, is_creating) {
    const n = data.number;
    const d = data.size;
    const s = d / 4;
    const x1 = data.x_pos;
    const y1 = data.y_pos;
    let xi = x1;
    let yi = y1;
    const on = data.value;
    data.drawn = on;
    for (let i = 0; i < n; i++) {
        if (data.type === "vradio") {
            if (is_creating) {
                if (i) {
                    const line = CreateItem("line", GuiRadioLine(data, x1, yi, x1 + d, yi, i));
                    data.lines.push(line);
                }
                const button = CreateItem(
                    "rect",
                    GuiRadioButton(data, x1 + s, yi + s, x1 + d - s, yi + d - s, i, on === i),
                );
                data.buttons.push(button);
            } else {
                if (i) {
                    ConfigureItem(data.lines[i - 1], GuiRadioLine(data, x1, yi, x1 + d, yi, i));
                }
                ConfigureItem(
                    data.buttons[i],
                    GuiRadioButton(data, x1 + s, yi + s, x1 + d - s, yi + d - s, i, on === i),
                );
            }
            yi += d;
        } else {
            if (is_creating) {
                if (i) {
                    const line = CreateItem("line", GuiRadioLine(data, xi, y1, xi, y1 + d, i));
                    data.lines.push(line);
                }
                const button = CreateItem(
                    "rect",
                    GuiRadioButton(data, xi + s, y1 + s, xi + d - s, yi + d - s, i, on === i),
                );
                data.buttons.push(button);
            } else {
                if (i) {
                    ConfigureItem(data.lines[i - 1], GuiRadioLine(data, xi, y1, xi, y1 + d, i));
                }
                ConfigureItem(
                    data.buttons[i],
                    GuiRadioButton(data, xi + s, y1 + s, xi + d - s, yi + d - s, i, on === i),
                );
            }
            xi += d;
        }
    }
}

// ─────────────────────────────────────
function GuiRadioCreateLinesButtons(data) {
    data.lines = [];
    data.buttons = [];
    GuiRadioLinesButtons(data, true);
}

// ─────────────────────────────────────
function GuiRadioUpdateLinesButtons(data) {
    GuiRadioLinesButtons(data, false);
}

// ─────────────────────────────────────
function GuiRadioText(data) {
    return GuiText(data);
}

// ─────────────────────────────────────
function GuiRadioUpdateButton(data) {
    ConfigureItem(data.buttons[data.drawn], {
        display: "none",
    });
    ConfigureItem(data.buttons[data.value], {
        fill: ColFromLoad(data.fg_color),
        stroke: ColFromLoad(data.fg_color),
        display: "inline",
    });
    data.drawn = data.value;
}

// ─────────────────────────────────────
function GuiRadioOnMouseDown(data, e) {
    const p = GuiMousePoint(e);
    if (data.type === "vradio") {
        data.value = Math.floor((p.y - data.y_pos) / data.size);
    } else {
        data.value = Math.floor((p.x - data.x_pos) / data.size);
    }
    GuiRadioUpdateButton(data);
    Pd4Web.sendFloat(data.receive, data.value);
}

// ─────────────────────────────────────
function GuiRadioSetup(args, id) {
    const data = {};
    data.x_pos = parseInt(args[2]) - Pd4Web.x_pos;
    data.y_pos = parseInt(args[3]) - Pd4Web.y_pos;
    data.type = args[4];
    data.size = parseInt(args[5]);
    data.new_old = parseInt(args[6]);
    data.init = parseInt(args[7]);
    data.number = parseInt(args[8]) || 1;
    data.send = args[9];
    data.receive = args[10];
    data.label = args[11] === "empty" ? "" : args[11];
    data.x_off = parseInt(args[12]);
    data.y_off = parseInt(args[13]);
    data.font = parseInt(args[14]);
    data.fontsize = parseInt(args[15]);
    data.bg_color = isNaN(args[16]) ? args[16] : parseInt(args[16]);
    data.fg_color = isNaN(args[17]) ? args[17] : parseInt(args[17]);
    data.label_color = isNaN(args[18]) ? args[18] : parseInt(args[18]);
    data.default_value = parseFloat(args[19]);
    data.value = data.init ? data.default_value : 0;
    data.id = `${data.type}_${id++}`;

    // create svg
    data.rect = CreateItem("rect", GuiRadioRect(data));
    GuiRadioCreateLinesButtons(data);
    data.text = CreateItem("text", GuiRadioText(data));
    data.text.textContent = data.label;

    // handle event
    if (Pd4Web.isMobile) {
        data.rect.addEventListener("touchstart", function (e) {
            for (const touch of e.changedTouches) {
                GuiRadioOnMouseDown(data, touch);
            }
        });
    } else {
        data.rect.addEventListener("mousedown", function (e) {
            GuiRadioOnMouseDown(data, e);
        });
    }
    BindGuiReceiver(data);
}

//╭─────────────────────────────────────╮
//│             Vu: VuRect              │
//╰─────────────────────────────────────╯
function GuiVuRect(data) {
    return {
        x: data.x_pos,
        y: data.y_pos,
        rx: 2,
        ry: 2,
        width: data.width,
        height: data.height,
        fill: Pd4Web.AutoTheme ? "transparent" : ColFromLoad(data.bg_color),
        id: `${data.id}_rect`,
        class: "border unclickable",
    };
}

// ─────────────────────────────────────
function GuiVudBRects(data) {
    const colors = ["#f430f0", "#fc2828", "#e8e828", "#ff8001", "#00ffff"];
    const getColor = (i) =>
        i === 39
            ? colors[4]
            : i >= 11 && i <= 38
              ? colors[3]
              : i >= 14 && i <= 22
                ? colors[2]
                : i >= 1 && i <= 10
                  ? colors[1]
                  : colors[0];

    const miniWidth = data.width - 3,
        miniHeight = (data.height - 2) / 40;
    data.mini_rects = Array.from({ length: 40 }, (_, i) => {
        const rect = CreateItem("rect", {
            x: data.x_pos + 1.5,
            y: data.y_pos + 1 + i * miniHeight,
            width: miniWidth,
            height: miniHeight - 0.1,
            fill: "transparent",
            active: getColor(i),
            id: `${data.id}_mini_rect_${i}`,
            class: "unclickable vu-mini-rect",
            rx: 0.5,
            ry: 0.5,
        });
        return rect;
    });
}

// ─────────────────────────────────────
function GuiVuUpdateGain(data) {
    const thresholds = [
        -99, -100, -80, -60, -55, -50, -45, -40, -35, -30, -27, -25, -22, -20, -18, -16, -14, -12, -10, -9, -7, -6, -5,
        -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11,
    ];
    const amount = thresholds.findIndex((t) => data.value <= t) || 40;
    if (data.value < -100) {
        return;
    }

    data.mini_rects.forEach((rect, i) => {
        rect.style.fill = 41 - i < amount ? rect.getAttribute("active") : getCssVariable("--vu-active");
    });
}

// ─────────────────────────────────────
function GuiVuSetup(args, id) {
    const data = {
        x_pos: parseInt(args[2]) - Pd4Web.x_pos,
        y_pos: parseInt(args[3]) - Pd4Web.y_pos,
        type: args[4],
        width: args[5],
        height: parseInt(args[6]),
        receive: args[7],
        id: `${args[4]}_${id++}`,
    };
    data.rect = CreateItem("rect", GuiVuRect(data));
    GuiVudBRects(data);
    BindGuiReceiver(data);
}

//╭─────────────────────────────────────╮
//│             Canvas: Cnv             │
//╰─────────────────────────────────────╯

function GuiCnvVisibleRect(data) {
    return {
        x: data.x_pos,
        y: data.y_pos,
        rx: 2,
        ry: 2,
        width: data.width,
        height: data.height,
        fill: ColFromLoad(data.bg_color),
        stroke: ColFromLoad(data.bg_color),
        id: `${data.id}_visible_rect`,
        class: "unclickable",
    };
}

// ─────────────────────────────────────
function GuiCnvSelectableRect(data) {
    return {
        x: data.x_pos,
        y: data.y_pos,
        rx: 2,
        ry: 2,
        width: data.size,
        height: data.size,
        fill: "none",
        stroke: ColFromLoad(data.bg_color),
        id: `${data.id}_selectable_rect`,
        class: "unclickable",
    };
}

// ─────────────────────────────────────
function GuiCnvText(data) {
    return GuiText(data);
}

// ─────────────────────────────────────
function GuiCnvSetup(args, id) {
    const data = {};
    data.x_pos = parseInt(args[2]);
    data.y_pos = parseInt(args[3]);
    data.type = args[4];
    data.size = parseInt(args[5]);
    data.width = parseInt(args[6]);
    data.height = parseInt(args[7]);
    data.send = args[8];
    data.receive = args[9];
    data.label = args[10] === "empty" ? "" : args[10];
    data.x_off = parseInt(args[11]);
    data.y_off = parseInt(args[12]);
    data.font = parseInt(args[13]);
    data.fontsize = parseInt(args[14]);
    data.bg_color = isNaN(args[15]) ? args[15] : parseInt(args[15]);
    data.label_color = isNaN(args[16]) ? args[16] : parseInt(args[16]);
    data.unknown = parseFloat(args[17]);
    data.id = `${data.type}_${id++}`;

    // create svg
    data.visible_rect = CreateItem("rect", GuiCnvVisibleRect(data));
    data.selectable_rect = CreateItem("rect", GuiCnvSelectableRect(data));
    data.text = CreateItem("text", GuiCnvText(data));
    data.text.textContent = data.label;

    // subscribe receiver
    BindGuiReceiver(data);
}

//╭─────────────────────────────────────╮
//│           else/knob Knob            │
//╰─────────────────────────────────────╯
function GuiKnobRect(data) {
    return {
        x: data.x_pos,
        y: data.y_pos,
        rx: 2,
        ry: 2,
        width: data.size,
        height: data.size,
        id: `${data.id}_rect`,
        class: "border clickable knob",
    };
}

// ─────────────────────────────────────
function GuiKnobCircleCenter(data) {
    const r = (data.size - 2) / 2;
    const cx = data.x_pos + r + 1;
    const cy = data.y_pos + r + 1;
    return {
        cx: cx,
        cy: cy,
        r: data.size / 50,
        //fill: "black",
        //stroke: "black",
        "stroke-width": 0.5,
        id: `${data.id}_knob_center`,
        class: "unclickable",
    };
}

// ─────────────────────────────────────
function GuiKnobArc(data) {
    const r = ((data.size - 2) / 2) * (data.radius * 1.3); // Radius scaled down by 0.9
    const cx = data.x_pos + (data.size - 2) / 2 + 1;
    const cy = data.y_pos + (data.size - 2) / 2 + 1;

    // Angle in degrees (0 to 360)
    const angle = data.ag_range;

    // Calculate the half angle to center the arc around 12 o'clock
    const halfAngle = Math.PI * (angle / 360);
    const startAngle = -Math.PI / 2 - halfAngle; // Start point adjusted based on angle
    const endAngle = -Math.PI / 2 + halfAngle; // End point adjusted to be symmetric

    // Calculate the coordinates for the arc's endpoints
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    // Large arc flag: 1 if angle is greater than 180 degrees, else 0
    const largeArcFlag = angle > 180 ? 1 : 0;

    // SVG path for the arc
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

    return {
        d: d,
        fill: "transparent",
        "stroke-width": 1,
        "stroke-linecap": "round",
        id: `${data.id}_knob_arc`,
        class: "unclickable border",
    };
}

// ─────────────────────────────────────
function GuiKnobPointer(data) {
    var r = (data.size - 2) / 2;
    data.cx = data.x_pos + r + 1;
    data.cy = data.y_pos + r + 1;
    r = r * data.radius; // Adjust pointer length relative to knob size

    const halfAngle = Math.PI * (data.ag_range / 360);
    const startAngle = -Math.PI / 2 - halfAngle; // Start point adjusted based on angle
    const x1 = data.cx + r * Math.cos(startAngle);
    const y1 = data.cy + r * Math.sin(startAngle);

    return {
        x1: x1,
        y1: y1,
        x2: data.cx,
        y2: data.cy,
        stroke: "white",
        "stroke-width": 2,
        "stroke-linecap": "round",
        class: "unclickable knob-pointer",
    };
}
// ─────────────────────────────────────
function GuiGetTickPosition(data, i) {
    const cx = data.x_pos + (data.size - 2) / 2 + 1;
    const cy = data.y_pos + (data.size - 2) / 2 + 1;
    const tickRadius = ((data.size - 2) / 2) * data.radius; // Slightly smaller than pointer radius

    // Add tick marks
    const halfAngle = Math.PI * (data.ag_range / 360);
    const startAngle = -Math.PI / 2 - halfAngle;
    const endAngle = -Math.PI / 2 + halfAngle;
    const tickStep = data.ticks > 1 ? (endAngle - startAngle) / (data.ticks - 1) : 0;
    const tickAngle = startAngle + i * tickStep;

    // Calculate tick position
    const x1 = cx + tickRadius * Math.cos(tickAngle);
    const y1 = cy + tickRadius * Math.sin(tickAngle);
    return { x1, y1 };
}

// ─────────────────────────────────────
function GuiKnobTicks(data) {
    // Calculate center position and radius for ticks
    const cx = data.x_pos + (data.size - 2) / 2 + 1;
    const cy = data.y_pos + (data.size - 2) / 2 + 1;
    const tickRadius = ((data.size - 2) / 2) * data.radius * 1.5; // Slightly smaller than pointer radius

    // Add tick marks
    const halfAngle = Math.PI * (data.ag_range / 360);
    const startAngle = -Math.PI / 2 - halfAngle;
    const endAngle = -Math.PI / 2 + halfAngle;
    const tickStep = data.ticks > 1 ? (endAngle - startAngle) / (data.ticks - 1) : 0;

    for (let i = 0; i < data.ticks; i++) {
        const tickAngle = startAngle + i * tickStep;

        // Calculate tick position
        const x1 = cx + tickRadius * Math.cos(tickAngle);
        const y1 = cy + tickRadius * Math.sin(tickAngle);
        const x2 = cx + (tickRadius - 1) * Math.cos(tickAngle); // Shorter inner line
        const y2 = cy + (tickRadius - 1) * Math.sin(tickAngle);

        // Create the tick line
        const tick = CreateItem("line", {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            //stroke: getCssVariable("--knob-tick"),
            "stroke-linecap": "round",
            "stroke-width": 1.5,
            class: "unclickable border",
        });

        // Append tick to the knob
        data.rect.parentNode.appendChild(tick);
    }
}

// ─────────────────────────────────────
function GuiKnobOnMouseDown(data, e, n) {
    data.beingDragged = true;
    data.pointer.style.stroke = getCssVariable("--knob-selected");
    data.startMoveX = e.clientX;
    data.startMoveY = e.clientY;
    data.startValue = data.value || 0;
}

// ─────────────────────────────────────
function GuiKnobOnMouseMove(data, e) {
    let mouseIsDown = e.buttons === 1;
    let selectedCol = getCssVariable("--knob-selected");
    if (data.pointer.getAttribute("stroke") !== selectedCol && mouseIsDown) {
        data.beingDragged = true;
        data.pointer.style.stroke = selectedCol;
        data.pointer.setAttribute("stroke", selectedCol);
        data.startMoveX = e.clientX;
        data.startMoveY = e.clientY;
        data.startValue = data.value || 0;
    }

    if (!data.beingDragged) {
        return;
    }

    // Calculate the vertical movement (dy) since the dragging started
    const startY = data.startMoveY;
    const endY = e.clientY;
    const dy = startY - endY; // Positive dy means upward movement, negative means downward

    // Calculate the change in value based on dy
    const knobRange = data.ag_range; // Maximum knob value (in degrees)
    const sensitivity = data.size * 2; // Full range achieved with twice the size of the knob
    const valueChange = (dy / sensitivity) * knobRange;

    // Update the knob value based on the initial value when dragging started
    data.value = Math.min(Math.max(data.startValue + valueChange, 0), knobRange);

    // Calculate the half angle to center the arc around 12 o'clock
    const halfAngle = Math.PI * (data.ag_range / 360);
    const startAngle = -Math.PI / 2 - halfAngle; // Adjusted start point

    if (data.discrete) {
        const tickValue = data.ag_range / (data.ticks - 1);
        let discreteAngle = 0;
        for (let i = 0; i < data.ticks; i++) {
            if (data.value >= i * tickValue && data.value <= (i + 1) * tickValue) {
                const midPoint = i * tickValue + tickValue / 2;
                discreteAngle = data.value < midPoint ? i : i + 1;
                break;
            }
        }
        let pos = GuiGetTickPosition(data, discreteAngle);
        data.pointer.setAttribute("x1", pos.x1);
        data.pointer.setAttribute("y1", pos.y1);
        let mappedValue = ((discreteAngle * tickValue) / knobRange) * (data.max - data.min) + data.min;
        if (Pd4Web) {
            Pd4Web.sendFloat(data.send, mappedValue);
        }
    } else {
        const angleRadians = startAngle + (data.value / knobRange) * (2 * halfAngle);
        const pointerRadius = ((data.size - 2) / 2) * data.radius; // Adjust pointer length relative to knob size
        const x1 = data.cx + pointerRadius * Math.cos(angleRadians);
        const y1 = data.cy + pointerRadius * Math.sin(angleRadians);
        data.pointer.setAttribute("x1", x1);
        data.pointer.setAttribute("y1", y1);
        let mappedValue = (data.value / knobRange) * (data.max - data.min) + data.min;
        if (Pd4Web) {
            Pd4Web.sendFloat(data.send, mappedValue);
        }
    }
}

// ─────────────────────────────────────
function GuiKnobOnMouseUp(data, e, n) {
    let color = getCssVariable("--knob-pointer");
    data.pointer.setAttribute("stroke", color);
    data.pointer.style.stroke = getCssVariable(color);
    data.beingDragged = false;
}

// ─────────────────────────────────────
function GuiKnobSetup(args, id) {
    const data = {};
    data.x_pos = parseInt(args[2]);
    data.y_pos = parseInt(args[3]);
    data.type = args[4];

    data.size = parseInt(args[5]);
    data.min = parseFloat(args[6]);
    data.max = parseFloat(args[7]);
    data.init_value = parseFloat(args[8]);
    data.value = data.init_value;
    data.exp = parseFloat(args[9]);
    data.send = args[10];
    data.receive = args[11];
    data.bg = args[12];
    data.arc_color = args[13];
    data.fg = args[14];

    //data.something = args[15];
    data.circular_drag = args[16]; // not supported
    data.ticks = parseInt(args[17]);
    data.discrete = parseInt(args[18]);
    data.show_arc = parseInt(args[19]);

    data.ag_range = parseInt(args[20]);
    data.offset = parseFloat(args[21]);

    data.id = `${data.type}_${id++}`;
    data.radius = 0.6;

    // create svg
    data.rect = CreateItem("rect", GuiKnobRect(data));
    data.circle = CreateItem("circle", GuiKnobCircleCenter(data));
    if (data.show_arc) {
        data.circleBg = CreateItem("path", GuiKnobArc(data));
    }
    data.pointer = CreateItem("line", GuiKnobPointer(data));
    data.svgTicks = GuiKnobTicks(data);

    data.rect.addEventListener("mousemove", function (e) {
        GuiKnobOnMouseMove(data, e, 0);
    });
    data.rect.addEventListener("mouseup", function (e) {
        GuiKnobOnMouseUp(data, e, 0);
    });

    // subscribe receiver
    BindGuiReceiver(data);
}

//╭─────────────────────────────────────╮
//│              KeyBoard               │
//╰─────────────────────────────────────╯
function GuiKeyboardRect(data) {
    let width = data.width;
    let height = data.height;
    return {
        x: data.x_pos,
        y: data.y_pos,
        rx: 1,
        ry: 1,
        midi: data.midi,
        send: data.send,
        width: width,
        height: height,
        stroke: data.stroke,
        class: data.class,
        id: `${data.id}_key`,
    };
}

// ─────────────────────────────────────
function GuiKeyboardSetup(args, id) {
    const data = {};
    data.x_pos = parseInt(args[2]) - Pd4Web.x_pos;
    data.y_pos = parseInt(args[3]) - Pd4Web.y_pos;
    data.type = args[4];
    data.width = parseInt(args[5]);
    data.height = parseInt(args[6]);
    data.octave = parseInt(args[7]);
    data.lowC = parseInt(args[8]);
    data.velocity_nor = parseInt(args[9]);
    data.toggle = parseInt(args[10]);
    data.send = args[11];
    data.receive = args[12];

    data.keys = [];
    let keyI = 0;
    let keyX = data.x_pos;

    let allKeys = [];
    for (let i = 0; i < data.octave; i++) {
        for (let j = 0; j < 7; j++) {
            let key = {};
            key.x_pos = keyX;
            key.y_pos = data.y_pos;
            key.width = data.width;
            key.height = data.height;
            key.stroke = "black";
            key.class = "key-white";
            key.midi = (data.lowC + 1) * 12 + keyI;
            key.send = data.send;
            key.id = "white_" + keyI;
            key.index = keyI;
            allKeys[keyI] = key;
            keyI += 1;
            if (j !== 2 && j !== 6) {
                let blackKey = {};
                blackKey.id = "black_" + keyI;
                blackKey.x_pos = keyX + data.width / 1.5;
                blackKey.y_pos = data.y_pos;
                blackKey.stroke = "black";
                blackKey.class = "key-black";
                blackKey.midi = (data.lowC + 1) * 12 + keyI;
                blackKey.send = data.send;
                blackKey.width = data.width * 0.66;
                blackKey.height = data.height * 0.6;
                blackKey.index = keyI;
                allKeys[keyI] = blackKey;
                keyI += 1;
            }
            keyX += data.width;
        }
    }
    for (let key of allKeys) {
        if (key.class === "key-white") {
            data.keys[key.index] = CreateItem("rect", GuiKeyboardRect(key));
        }
    }
    for (let key of allKeys) {
        if (key.class === "key-black") {
            data.keys[key.index] = CreateItem("rect", GuiKeyboardRect(key));
        }
    }

    data.keys.forEach((keyElement) => {
        keyElement.addEventListener("mousedown", function (e) {
            const p = GuiMousePoint(e);
            let midi = e.target.getAttribute("midi");
            let vel = ((p.y - data.y_pos) / data.height) * 127;
            e.target.style.fill = getCssVariable("--key-down");
            if (Pd4Web) {
                if (Pd4Web.sendList !== undefined) {
                    Pd4Web.sendList(e.target.getAttribute("send"), [parseFloat(midi), vel]);
                }
            }
        });
        keyElement.addEventListener("mouseup", function (e) {
            if (e.target.getAttribute("class").includes("key-black")) {
                e.target.style.fill = getCssVariable("--keyboard-black-key");
            } else {
                e.target.style.fill = getCssVariable("--keyboard-white-key");
            }
            let midi = e.target.getAttribute("midi");
            if (Pd4Web) {
                if (Pd4Web.sendList !== undefined) {
                    Pd4Web.sendList(e.target.getAttribute("send"), [parseFloat(midi), 0]);
                }
            }
        });
    });
}

//╭─────────────────────────────────────╮
//│                Font                 │
//╰─────────────────────────────────────╯
function GObjFontyKludge(fontsize) {
    switch (fontsize) {
        case 8:
            return -0.5;
        case 10:
            return -1;
        case 12:
            return -1;
        case 16:
            return -1.5;
        case 24:
            return -3;
        case 36:
            return -6;
        default:
            return 0;
    }
}

// ─────────────────────────────────────
function SetFontEngineSanity() {
    const canvas = document.createElement("canvas"),
        ctx = canvas.getContext("2d"),
        test_text = "struct theremin float x float y";
    canvas.id = "font_sanity_checker_canvas";

    if (document.body) {
        document.body.appendChild(canvas);
    }
    ctx.font = "11.65px DejaVu Sans Mono";
    if (Math.floor(ctx.measureText(test_text).width) <= 217) {
        Pd4Web.FontEngineSanity = true;
    } else {
        Pd4Web.FontEngineSanity = false;
    }
    if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
    }
}

// ─────────────────────────────────────
function FontStackIsMaintainedByTroglodytes() {
    return !Pd4Web.FontEngineSanity;
}

// ─────────────────────────────────────
function FontMap() {
    return {
        8: 8.33,
        12: 11.65,
        16: 16.65,
        24: 23.3,
        36: 36.6,
    };
}

// ─────────────────────────────────────
function SubOptimalFontMap() {
    return {
        8: 8.45,
        12: 11.4,
        16: 16.45,
        24: 23.3,
        36: 36,
    };
}

// ─────────────────────────────────────
function FontHeightMap() {
    return {
        8: 11,
        10: 13,
        12: 16,
        16: 19,
        24: 29,
        36: 44,
    };
}

// ─────────────────────────────────────
function GObjFontSizeKludge(fontsize, return_type) {
    var ret,
        prop,
        fmap = FontStackIsMaintainedByTroglodytes() ? SubOptimalFontMap() : FontMap();
    if (return_type === "gui") {
        ret = fmap[fontsize];
        return ret ? ret : fontsize;
    } else {
        for (prop in fmap) {
            if (fmap.hasOwnProperty(prop)) {
                if (fmap[prop] == fontsize) {
                    return +prop;
                }
            }
        }
        return fontsize;
    }
}

// ─────────────────────────────────────
function PdFontSizeToGuiFontSize(fontsize) {
    return GObjFontSizeKludge(fontsize, "gui");
}

// ─────────────────────────────────────
function GuiTextText(data, line_index) {
    const left_margin = 2;
    const fmap = FontHeightMap();
    const font_height = fmap[Pd4Web.FontSize] * (line_index + 1);
    return {
        transform: `translate(${left_margin - 0.5})`,
        x: data.x_pos,
        y: data.y_pos + font_height + GObjFontyKludge(Pd4Web.FontSize),
        "shape-rendering": "crispEdges",
        "font-size": PdFontSizeToGuiFontSize(Pd4Web.FontSize) + "px",
        "font-weight": "normal",
        id: `${data.id}_text_${line_index}`,
        class: "comment",
    };
}

//╭─────────────────────────────────────╮
//│           Patch Handling            │
//╰─────────────────────────────────────╯
function UpdatePatchDivSize(content, patch_zoom) {
    const patchDiv = document.getElementById("Pd4WebPatchDiv");
    if (patchDiv == null) {
        return;
    }

    if (Pd4Web.isMobile) {
        patchDiv.style.width = "90%";
        patchDiv.style.marginLeft = "auto";
        patchDiv.style.marginRight = "auto";
    } else {
        const lines = content.split(";\n");
        var args = lines[0].split(" ");
        const canvasHeight = parseInt(args[5]);
        const canvasWidth = parseInt(args[4]);
        patchDiv.style.width = canvasWidth * patch_zoom + "px";
        patchDiv.style.height = canvasHeight * patch_zoom + "px";
        patchDiv.style.marginLeft = "auto";
        patchDiv.style.marginRight = "auto";
    }
}

// ─────────────────────────────────────
function UpdatePatchDivSizeCoords(width, height, patch_zoom) {
    const patchDiv = document.getElementById("Pd4WebPatchDiv");
    if (patchDiv == null) {
        console.warn("Patch div not found");
        return;
    }
    if (Pd4Web.isMobile) {
        patchDiv.style.width = "90%";
        patchDiv.style.marginLeft = "auto";
        patchDiv.style.marginRight = "auto";
    } else {
        patchDiv.style.width = width * patch_zoom + "px";
        patchDiv.style.height = height * patch_zoom + "px";
        patchDiv.style.marginLeft = "auto";
        patchDiv.style.marginRight = "auto";
    }
}

// ─────────────────────────────────────
function OpenPatch(content) {
    content = content.replace(/\r/g, "");
    let canvasLevel = 0;
    let id = 0;

    if (Pd4Web.Canvas) {
        while (Pd4Web.Canvas.lastChild) {
            Pd4Web.Canvas.removeChild(Pd4Web.Canvas.lastChild);
        }
    }

    UpdatePatchDivSize(content, Pd4Web.Zoom);

    const lines = content.split(";\n");
    Pd4Web.x_pos = 0;
    Pd4Web.y_pos = 0;
    let canvasLevelLocal = 0;
    for (let line of lines) {
        line = line.replace(/[\r\n]+/g, " ").trim();
        const args = line.split(" ");
        const type = args.slice(0, 2).join(" ");
        switch (type) {
            case "#N canvas":
                canvasLevelLocal++;
                if (canvasLevelLocal == 1) {
                    Pd4Web.width = parseInt(args[4]);
                    Pd4Web.height = parseInt(args[5]);
                }
                break;
            case "#X restore":
                canvasLevelLocal--;
                break;
            case "#X coords":
                if (canvasLevelLocal == 1) {
                    if (args.length == 11) {
                        Pd4Web.width = parseInt(args[6]);
                        Pd4Web.height = parseInt(args[7]);
                        Pd4Web.x_pos = parseInt(args[9]);
                        Pd4Web.y_pos = parseInt(args[10]);
                        UpdatePatchDivSizeCoords(Pd4Web.width, Pd4Web.height, Pd4Web.Zoom);
                    }
                }
                break;
        }
    }

    for (let line of lines) {
        line = line.replace(/[\r\n]+/g, " ").trim(); // remove newlines & carriage returns
        const args = line.split(" ");
        const type = args.slice(0, 2).join(" ");
        switch (type) {
            case "#N canvas":
                canvasLevel++;
                if (canvasLevel === 1 && args.length === 7) {
                    Pd4Web.CanvasWidth = Pd4Web.width;
                    Pd4Web.CanvasHeight = Pd4Web.height;
                    Pd4Web.FontSize = parseInt(args[6]);
                    Pd4Web.Canvas.setAttributeNS(null, "viewBox", `0 0 ${Pd4Web.CanvasWidth} ${Pd4Web.CanvasHeight}`);
                }
                break;
            case "#X restore":
                canvasLevel--;
                break;
            case "#X obj":
                if (args.length > 4) {
                    switch (args[4]) {
                        case "bng":
                            if (
                                canvasLevel === 1 &&
                                args.length === 19 &&
                                args[9] !== "empty" &&
                                args[10] !== "empty"
                            ) {
                                GuiBngSetup(args, id);
                            }
                            break;
                        case "tgl":
                            if (canvasLevel === 1 && args.length === 19 && args[7] !== "empty" && args[8] !== "empty") {
                                GuiTglSetup(args, id);
                            }
                            break;

                        case "nbx":
                            if (canvasLevel === 1 && args.length === 23 && args[7] !== "empty" && args[8] !== "empty") {
                                GuiNbxSetup(args, id);
                            }
                            break;

                        case "vsl":
                        case "hsl":
                            if (
                                canvasLevel === 1 &&
                                args.length === 23 &&
                                args[11] !== "empty" &&
                                args[12] !== "empty"
                            ) {
                                GuiSliderSetup(args, id);
                            }
                            break;
                        case "vradio":
                        case "hradio":
                            if (
                                canvasLevel === 1 &&
                                args.length === 20 &&
                                args[9] !== "empty" &&
                                args[10] !== "empty"
                            ) {
                                GuiRadioSetup(args, id);
                            }
                            break;
                        case "vu":
                            if (canvasLevel === 1 && args.length === 17 && args[7] !== "empty") {
                                GuiVuSetup(args, id);
                            }
                            break;
                        case "cnv":
                            if (canvasLevel === 1 && args.length === 18 && args[8] !== "empty" && args[9] !== "empty") {
                                GuiCnvSetup(args, id);
                            }
                            break;

                        //╭─────────────────────────────────────╮
                        //│        External Gui Objects         │
                        //╰─────────────────────────────────────╯
                        case "knob": // ELSE/KNOB
                            if (canvasLevel === 1) {
                                GuiKnobSetup(args, id);
                            }
                            break;
                        case "keyboard": // ELSE/KEYBOARD
                            if (canvasLevel === 1) {
                                GuiKeyboardSetup(args, id);
                            }
                            break;
                    }
                }
                break;
            case "#X text":
                if (args.length > 4 && canvasLevel === 1) {
                    // console.log(canvasLevel);
                    const data = {};
                    data.type = args[1];
                    data.x_pos = parseInt(args[2]) - Pd4Web.x_pos;
                    data.y_pos = parseInt(args[3]) - Pd4Web.y_pos;
                    data.comment = [];
                    const lines = args
                        .slice(4)
                        .join(" ")
                        .replace(/ \\,/g, ",")
                        .replace(/\\; /g, ";\n")
                        .replace(/ ;/g, ";")
                        .split("\n");
                    for (const line of lines) {
                        const lines = line.match(/.{1,60}(\s|$)/g);
                        for (const line of lines) {
                            data.comment.push(line.trim());
                        }
                    }
                    data.id = `${data.type}_${id++}`;
                    // TODO: Need to remove f {WIDTH} for when width of the text is especified

                    // create svg
                    data.texts = [];
                    for (let i = 0; i < data.comment.length; i++) {
                        const text = CreateItem("text", GuiTextText(data, i));
                        text.textContent = data.comment[i];
                        data.texts.push(text);
                    }
                }
                break;
        }
    }
    if (!canvasLevel) {
        alert("The main canvas not found in the pd file.");
        return;
    }
}

// ─────────────────────────────────────
async function Pd4WebInitGui(patch) {
    if (Pd4Web === undefined) {
        setTimeout(Pd4WebInitGui, 150);
        console.log("Pd4Web is not defined yet, wait...");
        return;
    }

    // Get the element
    setSoundIcon("--sound-off", "pulse 1s infinite");

    Pd4Web.isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    Pd4Web.CanvasWidth = 450;
    Pd4Web.CanvasHeight = 300;
    Pd4Web.FontSize = 12;
    if (typeof Pd4Web.GuiReceivers === "undefined") {
        Pd4Web.GuiReceivers = {}; // defined in pd4web.cpp Pd4WebJsHelpers
    }
    Pd4Web.Canvas = document.getElementById("Pd4WebCanvas");
    Pd4Web.Touches = {};
    Pd4Web.FontEngineSanity = false;
    Pd4Web.AutoTheme = true;

    if (Pd4Web.isMobile) {
        window.addEventListener("touchmove", function (e) {
            for (const touch of e.changedTouches) {
                GuiSliderOnMouseMove(touch, touch.identifier);
            }
        });
        window.addEventListener("touchend", function (e) {
            for (const touch of e.changedTouches) {
                GuiSliderOnMouseUp(touch.identifier);
            }
        });
        window.addEventListener("touchcancel", function (e) {
            for (const touch of e.changedTouches) {
                GuiSliderOnMouseUp(touch.identifier);
            }
        });
    } else {
        window.addEventListener("mousemove", function (e) {
            GuiSliderOnMouseMove(e, 0);
        });
        window.addEventListener("mouseup", function (_) {
            GuiSliderOnMouseUp(0);
        });
        window.addEventListener("mouseleave", function (_) {
            GuiSliderOnMouseUp(0);
        });
    }
    SetFontEngineSanity();

    // Auto Theming
    GetNeededStyles();
    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    darkModeMediaQuery.addEventListener("change", ThemeListener);

    // Open Patch
    if (Pd4Web.Canvas) {
        var File = patch;
        fetch(File)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.text();
            })
            .then((textContent) => {
                OpenPatch(textContent);
            })
            .catch((error) => {
                console.error("There has been a problem with your fetch operation:", error);
            });
    }
}

