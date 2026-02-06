const { ActivityLog } = require('../models');

const logActivity = async (userId, action, entityType, entityId, description, oldValues = null, newValues = null, req = null) => {
    try {
        await ActivityLog.create({
            userId,
            action,
            entityType,
            entityId,
            description,
            oldValues: oldValues ? JSON.stringify(oldValues) : null,
            newValues: newValues ? JSON.stringify(newValues) : null,
            ipAddress: req?.ip || req?.connection?.remoteAddress || null,
            userAgent: req?.headers?.['user-agent']?.substring(0, 255) || null
        });
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw - activity logging failure shouldn't break the main operation
    }
};

const activityLogger = (action, entityType) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);

        res.json = function (data) {
            if (data.success && req.session?.user) {
                const entityId = data.data?.id || req.params.id;
                logActivity(
                    req.session.user.id,
                    action,
                    entityType,
                    entityId,
                    `${action} ${entityType}`,
                    req.body._oldValues || null,
                    req.body,
                    req
                );
            }
            return originalJson(data);
        };

        next();
    };
};

module.exports = {
    logActivity,
    activityLogger
};
