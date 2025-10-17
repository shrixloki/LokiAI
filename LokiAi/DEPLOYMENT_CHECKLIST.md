# 🚀 LokiAI Production Deployment Checklist

Use this checklist to ensure a successful production deployment.

## Pre-Deployment

### ✅ Environment Setup

- [ ] Docker Desktop installed and running
- [ ] Docker Compose version 2.20+ verified
- [ ] Git repository cloned
- [ ] Sufficient disk space (10GB+)
- [ ] Sufficient RAM (8GB+)

### ✅ Configuration

- [ ] `.env.production` copied to `.env`
- [ ] Alchemy API key configured
- [ ] CoinGecko API key configured (optional)
- [ ] MongoDB password changed from default
- [ ] JWT secret updated
- [ ] Encryption key updated
- [ ] CORS origins configured for your domain

### ✅ Security Review

- [ ] All default passwords changed
- [ ] API keys stored securely
- [ ] SSL/TLS certificates generated (for production)
- [ ] Firewall rules configured
- [ ] CORS restricted to known origins

## Deployment

### ✅ Build Phase

- [ ] Clean previous builds: `docker-compose -f docker-compose.prod.yml down -v`
- [ ] Build all images: `docker-compose -f docker-compose.prod.yml build --no-cache`
- [ ] Verify images created: `docker images | grep lokiai`

### ✅ Start Services

- [ ] Start all services: `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Wait for services to be healthy (30-60 seconds)
- [ ] Check service status: `docker-compose -f docker-compose.prod.yml ps`
- [ ] All services show "Up" status

### ✅ Database Initialization

- [ ] Initialize MongoDB collections: `docker exec -it lokiai-mongodb mongosh -u admin -p lokiai2024 --authenticationDatabase admin < mongodb-init.js`
- [ ] Seed sample data (optional): `docker exec -it lokiai-backend node seed-production-data.js`
- [ ] Verify data: `docker exec -it lokiai-mongodb mongosh -u admin -p lokiai2024 --authenticationDatabase admin loki_agents --eval "db.agents.countDocuments()"`

## Post-Deployment Verification

### ✅ Health Checks

- [ ] Backend health: `curl http://localhost/api/health`
- [ ] Biometrics health: `curl http://localhost/biometrics/health`
- [ ] MongoDB connection: `docker exec lokiai-mongodb mongosh --eval "db.adminCommand('ping')"`
- [ ] Frontend accessible: Open http://localhost in browser

### ✅ API Testing

- [ ] Run test suite: `node test-production-deployment.js`
- [ ] All tests passing
- [ ] Dashboard loads correctly
- [ ] AI Agents page displays data
- [ ] Analytics page shows charts
- [ ] Cross-chain activity loads

### ✅ Authentication Flow

- [ ] MetaMask connection works
- [ ] Wallet signature verification works
- [ ] Biometric setup modal appears
- [ ] Keystroke capture works
- [ ] Voice capture works (if microphone available)

### ✅ Real-Time Features

- [ ] Socket.IO connection established
- [ ] Real-time agent updates working
- [ ] Portfolio updates streaming
- [ ] Activity notifications appearing

## Monitoring Setup

### ✅ Logging

- [ ] View all logs: `docker-compose -f docker-compose.prod.yml logs -f`
- [ ] Backend logs accessible
- [ ] Biometrics logs accessible
- [ ] NGINX access logs working
- [ ] Error logs being captured

### ✅ Monitoring Tools

- [ ] Service monitor running: `.\monitor-services.ps1`
- [ ] Resource usage acceptable
- [ ] No memory leaks detected
- [ ] CPU usage normal

### ✅ Backup Strategy

- [ ] MongoDB backup script created
- [ ] Backup schedule configured
- [ ] Backup restoration tested
- [ ] Biometric models backed up

## Performance Optimization

### ✅ Frontend

- [ ] Vite build optimized
- [ ] Assets compressed (gzip)
- [ ] Static files cached
- [ ] Lazy loading implemented

### ✅ Backend

- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Rate limiting enabled (if needed)
- [ ] Caching strategy implemented

### ✅ Infrastructure

- [ ] NGINX compression enabled
- [ ] Load balancing configured (if multiple instances)
- [ ] CDN configured (if applicable)
- [ ] SSL/TLS optimized

## Security Hardening

### ✅ Network Security

- [ ] Firewall rules applied
- [ ] Only necessary ports exposed
- [ ] Internal network isolated
- [ ] DDoS protection enabled (if applicable)

### ✅ Application Security

- [ ] Input validation enabled
- [ ] SQL injection prevention
- [ ] XSS protection headers
- [ ] CSRF protection enabled
- [ ] Rate limiting configured

### ✅ Data Security

- [ ] Biometric data encrypted at rest
- [ ] Sensitive data encrypted in transit
- [ ] Database authentication enabled
- [ ] API keys not exposed in logs

## Disaster Recovery

### ✅ Backup Plan

- [ ] Automated backups scheduled
- [ ] Backup retention policy defined
- [ ] Off-site backup storage configured
- [ ] Backup restoration procedure documented

### ✅ Rollback Plan

- [ ] Previous version images tagged
- [ ] Rollback procedure documented
- [ ] Database migration rollback tested
- [ ] Emergency contacts defined

## Documentation

### ✅ Technical Documentation

- [ ] Architecture diagram updated
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Deployment guide reviewed

### ✅ Operational Documentation

- [ ] Runbook created
- [ ] Troubleshooting guide available
- [ ] Monitoring procedures documented
- [ ] Escalation procedures defined

## Go-Live

### ✅ Final Checks

- [ ] All checklist items completed
- [ ] Stakeholders notified
- [ ] Support team briefed
- [ ] Monitoring alerts configured

### ✅ Launch

- [ ] DNS updated (if applicable)
- [ ] SSL certificates installed
- [ ] Services started
- [ ] Health checks passing
- [ ] Users can access application

### ✅ Post-Launch

- [ ] Monitor for 24 hours
- [ ] Check error rates
- [ ] Verify performance metrics
- [ ] Collect user feedback
- [ ] Document any issues

## Maintenance

### ✅ Regular Tasks

- [ ] Weekly: Review logs for errors
- [ ] Weekly: Check disk space
- [ ] Weekly: Verify backups
- [ ] Monthly: Update dependencies
- [ ] Monthly: Security audit
- [ ] Quarterly: Performance review

### ✅ Updates

- [ ] Update procedure documented
- [ ] Testing environment available
- [ ] Rollback plan ready
- [ ] Maintenance window scheduled

---

## Quick Commands Reference

### Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Restart Service
```bash
docker-compose -f docker-compose.prod.yml restart backend
```

### Check Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Run Tests
```bash
node test-production-deployment.js
```

### Monitor Services
```bash
.\monitor-services.ps1
```

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Sign-off**: _______________

