const PORT = 4000;
const expiryInSeconds = 3600;
const KSBackend = process.env.KSBackendURL || 'https://typeforslack.herokuapp.com/internal/racetrack/para'

module.exports = {
  PORT,
  expiryInSeconds,
  KSBackend
};
