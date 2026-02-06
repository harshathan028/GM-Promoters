const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }

    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    return res.redirect('/login.html');
};

const hasRole = (...roles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            return res.redirect('/login.html');
        }

        if (!roles.includes(req.session.user.role)) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.'
                });
            }
            return res.status(403).send('Access denied');
        }

        return next();
    };
};

const isAdmin = hasRole('admin');
const isAdminOrAgent = hasRole('admin', 'agent');
const isStaff = hasRole('admin', 'agent', 'staff');

module.exports = {
    isAuthenticated,
    hasRole,
    isAdmin,
    isAdminOrAgent,
    isStaff
};
