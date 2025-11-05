const users = [
  { id: 1, name: 'Anna' },
  { id: 2, name: 'Oleh' },
  { id: 3, name: 'Marta' },
];

// simulate async API call
async function fetchUserRole(id) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(id === 1 ? 'admin' : 'user'), 200);
  });
}

function buildUserStrings() {
  const result = users.map(async (user) => {
    const role = await fetchUserRole(user.id); // <-- async inside map
    return `${user.name} (${role})`;
  });

  // ❌ This returns an array of Promises, not resolved values
  return result;
}

const list = buildUserStrings();
console.log(list); // [Promise, Promise, Promise] 🤦

6666yyyyu


async function buildUserStrings() {
  // map returns an array of Promises
  const promises = users.map(async (user) => {
    const role = await fetchUserRole(user.id);
    return `${user.name} (${role})`;
  });

  // wait for all Promises to resolve
  return Promise.all(promises);
}

(async () => {
  const list = await buildUserStrings();
  console.log(list);
})();


555555tyy6



async function buildUserStrings() {
  const result = [];

  // for...of allows using await inside the loop
  for (const user of users) {
    const role = await fetchUserRole(user.id);
    result.push(`${user.name} (${role})`);
  }

  return result;
}

(async () => {
  const list = await buildUserStrings();
  console.log(list);
})();



