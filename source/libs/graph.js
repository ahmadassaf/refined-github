import {get} from 'lodash';
import OptionsSync from 'webext-options-sync';

export default async query => {
	
	const headers = {
		'User-Agent': 'Refined GitHub'
	};
	const {personalToken} = await new OptionsSync().getAll();
	if (personalToken) {
		headers.Authorization = `bearer ${personalToken}`;
	}
	const api = location.hostname === 'github.com' ? 'https://api.github.com/graphql' : `${location.origin}/api/graphql`;
	try {
		const response = await fetch(api, {
			method: 'POST',
			headers,
			body: JSON.stringify({query})
		});
		
		const graphResponse = await response.json();
		
		if (graphResponse.errors) {
			console.error(graphResponse.errors[0].message);
			return null;
		} else {
			return graphResponse.data;
		}
	} catch (error) {
		const errorObject = JSON.parse(JSON.stringify(error));
		if (get(errorObject, 'response.status')) {
			console.error(`Refined GitHub couldn’t access this endpoint as it requires you to be authenticated ⛔. Please make sure you have a valid access token (check ${errorObject.response.documentation_url})`);
		} else console.error(error);
		return null;
	}
};
