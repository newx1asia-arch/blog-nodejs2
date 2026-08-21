function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }
    if (req.session.userRole !== 'admin') {
        return res.status(403).send('<h1>403 - Bạn không có quyền truy cập trang này</h1><a href="/">Quay về trang chủ</a>');
    }
    next();
}

module.exports = { requireAuth, requireAdmin };