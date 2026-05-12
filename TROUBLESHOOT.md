# 502 Bad Gateway 排查指南

## 问题原因

502 错误表示 Nginx 无法连接到后端服务器（2645端口）

## 排查步骤

### 1. 检查后端服务是否运行

```bash
# 在服务器上执行
netstat -tlnp | grep 2645
# 或
ss -tlnp | grep 2645
# 或
lsof -i :2645

# 如果没有输出，说明后端服务没有启动
```

### 2. 检查后端服务监听地址

```bash
# 检查后端服务是否只监听 localhost
netstat -tlnp | grep 2645

# 如果显示 127.0.0.1:2645，说明只监听本地
# 需要改为监听 0.0.0.0:2645 或 123.60.91.107:2645
```

### 3. 测试后端服务连接

```bash
# 从服务器内部测试
curl http://127.0.0.1:2645/api/user/login
curl http://123.60.91.107:2645/api/user/login

# 如果可以连接，说明服务正常，可能是防火墙问题
```

### 4. 检查防火墙

```bash
# 检查防火墙状态
firewall-cmd --list-all
# 或
ufw status

# 如果防火墙开启，需要开放 2645 端口
firewall-cmd --zone=public --add-port=2645/tcp --permanent
firewall-cmd --reload
```

### 5. 检查安全组/云服务器控制台

如果是云服务器（阿里云、腾讯云等），需要在控制台配置安全组规则：
- 入站规则：开放 TCP 2645 端口

## 常见解决方案

### 方案 1：后端服务只监听本地

如果后端只监�� `127.0.0.1:2645`，修改 Nginx 配置：

```nginx
location /api/ {
    # 改为代理到本地地址
    proxy_pass http://127.0.0.1:2645;
    # ... 其他配置
}
```

### 方案 2：后端服务监听所有地址

修改后端服务配置，监听 `0.0.0.0:2645` 而不是 `127.0.0.1:2645`

### 方案 3：检查端口是否正确

确认后端服务确实运行在 2645 端口，而不是其他端口。

## 快速修复配置

如果后端服务监听在本地，使用以下 Nginx 配置：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:2645;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # CORS 配置
    add_header Access-Control-Allow-Origin $http_origin always;
    add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
    add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    add_header Access-Control-Allow-Credentials true always;
}
```

## 验证步骤

1. 确认后端服务运行：`netstat -tlnp | grep 2645`
2. 测试后端连接：`curl http://127.0.0.1:2645/api/user/login`
3. 修改 Nginx 配置（使用 127.0.0.1 或 0.0.0.0）
4. 重载 Nginx：`nginx -s reload`
5. 测试完整链路：`curl http://123.60.91.107:9501/api/user/login`
