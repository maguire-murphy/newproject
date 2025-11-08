import { sequelize } from '../config/database';
import { Organization } from '../models/Organization';
import { Project } from '../models/Project';
import { v4 as uuidv4 } from 'uuid';

async function createDefaultProjects() {
  try {
    console.log('🔍 Checking for organizations without projects...');

    // Find all organizations
    const organizations = await Organization.findAll();
    console.log(`Found ${organizations.length} organizations`);

    for (const org of organizations) {
      // Check if organization already has projects
      const existingProjects = await Project.findAll({
        where: { organizationId: org.id }
      });

      if (existingProjects.length === 0) {
        console.log(`➕ Creating default project for organization: ${org.name}`);
        
        await Project.create({
          id: uuidv4(),
          name: 'Default Project',
          domain: org.subdomain + '.com',
          organizationId: org.id,
          trackingId: `track_${uuidv4().slice(0, 8)}`,
          isActive: true,
        });

        console.log(`✅ Default project created for ${org.name}`);
      } else {
        console.log(`⏭️  Organization ${org.name} already has ${existingProjects.length} project(s)`);
      }
    }

    console.log('🎉 Default project creation completed!');
  } catch (error) {
    console.error('❌ Error creating default projects:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
createDefaultProjects();