function inDays(d1, d2) {
  return Math.floor((d2.getTime() - d1.getTime()) / (24 * 3600 * 1000));
}

module.exports = async ({github, dependencyName}) => {
  const organization = 'alfresco';
  const dependencyFullName = `@${organization}/${dependencyName}`;
  const pkg = require('../../../package.json');

  const localVersion = pkg.dependencies[dependencyFullName];

  const { data: availablePakages } = await github.rest.packages.getAllPackageVersionsForPackageOwnedByOrg({
      package_type: 'npm',
      package_name: dependencyName,
      org: organization
  });

  const latestPkgToUpdate = availablePakages[0];

  if (localVersion === latestPkgToUpdate?.name) {
      return { hasNewVersion: 'false' };
  } else {
      const findLocalVerionOnRemote = availablePakages.find((item) => item.name === localVersion);
      let rangeInDays = 'N/A'
      if (findLocalVerionOnRemote !== undefined) {
          var creationLocal = new Date(findLocalVerionOnRemote.created_at);
          var creationLatest = new Date(latestPkgToUpdate.created_at,);
          rangeInDays = inDays(creationLocal, creationLatest);
      }
      return { hasNewVersion: 'true', remoteVersion: { name: latestPkgToUpdate?.name, rangeInDays } , localVersion};
  }

}
