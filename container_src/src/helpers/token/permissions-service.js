import Redis from "ioredis";

const redis = new Redis({
    host: "localhost",
    port: 6379,
});

async function getUserPermissions(userId) {
    const cacheKey = `permissions:${userId}`;

    try {
        const cachedPermissions = await redis.get(cacheKey);
        if (cachedPermissions) {
            return JSON.parse(cachedPermissions);
        }
    } catch (error) {
        console.error("Erro ao acessar Redis: ", error);
    }

    const permissions = await getUserPermissionsFromDB(userId);
    try {
        await redis.set(cacheKey, JSON.stringify(permissions), "EX", 3600);
    } catch (error) {
        console.error("Erro ao armazenar no Redis: ", error);
    }
    return permissions;
}

async function updateUserPermissions(userId, newPermissions) {
    await updatePermissionsInDB(userId, newPermissions);

    const cacheKey = `permissions:${userId}`;
    try {
        await redis.del(cacheKey);
    } catch (error) {
        console.error("Erro ao invalidar cache no Redis: ", error);
    }
}

export {getUserPermissions, updateUserPermissions};
