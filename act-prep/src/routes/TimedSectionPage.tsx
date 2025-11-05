import { useParams } from 'react-router-dom'

export function TimedSectionPage() {
	const { formId, section } = useParams()
	return (
		<div>
			<h1 className="text-xl font-semibold mb-2">Timed Section</h1>
			<p className="text-sm text-gray-600">Form {formId} – Section {section}</p>
		</div>
	)
}