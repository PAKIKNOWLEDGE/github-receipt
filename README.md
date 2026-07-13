# GitHub Receipt Generator

生成 GitHub 个人资料的收据风格图片。

![Classic Style](preview.png)

## 两种使用方式

### 方式 1：直接打开 HTML（最简单）

双击 `index.html`，浏览器打开即可使用。无需安装任何东西。

- 输入 GitHub 用户名
- 选择风格（5 种可选）
- 点击 Generate 生成
- 点击 Download 下载 PNG

### 方式 2：Python 命令行

```bash
# 安装依赖
pip install -r requirements.txt

# 生成收据
python github_receipt.py torvalds

# 指定风格
python github_receipt.py torvalds -s neon

# 指定输出文件
python github_receipt.py torvalds -s vintage -o my.png
```

Windows 用户可双击 `receipt.bat`。

## 风格预览

| 风格 | 命令参数 | 说明 |
|------|----------|------|
| Classic | `classic` | 经典收据（默认） |
| Vintage | `vintage` | 复古泛黄 |
| Minimal | `minimal` | 极简黑白 |
| Neon | `neon` | 霓虹暗色 |
| Terminal | `terminal` | 终端风格 |

## GitHub Token

未认证 API 限制 60 次/小时。设置 Token 可提升到 5000 次/小时。

**HTML 版本：** 页面上有 Token 输入框，输入后自动保存到浏览器。

**Python 版本：**
```bash
# 方式 1：环境变量
export GITHUB_TOKEN=ghp_xxxxx

# 方式 2：命令行参数
python github_receipt.py torvalds -t ghp_xxxxx
```

获取 Token：https://github.com/settings/tokens （勾选 `repo` 权限即可）

## 国内镜像

pip 安装慢时使用清华镜像：

```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

## 文件说明

```
├── index.html          # 网页版（双击打开）
├── github_receipt.py   # Python CLI 版本
├── receipt.bat         # Windows 快捷启动
├── requirements.txt    # Python 依赖
└── README.md
```

## License

GNU License
